import json
import os
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai import (
    build_default_capabilities,
    build_default_health,
    detect_technologies,
    generate_ai_analysis,
    generate_issue_from_contribution,
    generate_recommendations,
    normalize_architecture,
)

load_dotenv(dotenv_path=Path(__file__).with_name('.env'))

app = FastAPI(title='RepoLens API', version='0.1.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3002',
        'http://localhost:5173',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:5173',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '').strip()
AI_API_KEY = os.getenv('AI_API_KEY', '').strip()

IGNORED_PREFIXES = (
    'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache', 'vendor', '__pycache__', '.venv', '.pytest_cache'
)
IMPORTANT_FILES = {
    'readme.md',
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'requirements.txt',
    'pyproject.toml',
    'cargo.toml',
    'go.mod',
    'dockerfile',
    'docker-compose.yml',
    'tsconfig.json',
}
SOURCE_ROOTS = ('src/', 'app/', 'lib/', 'components/', 'api/', 'server/', 'backend/', 'frontend/')


class AnalyzeRepositoryRequest(BaseModel):
    url: str = Field(..., description='GitHub repository URL')


class ContributionRequest(BaseModel):
    repository_url: str = Field(...)
    analysis: dict[str, Any] | None = None


class IssueGenerationRequest(BaseModel):
    contribution: dict[str, Any] = Field(...)


async def github_request(path: str, *, params: dict[str, Any] | None = None) -> dict[str, Any]:
    headers = {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'RepoLens/1.0',
    }
    if GITHUB_TOKEN:
        headers['Authorization'] = f'Bearer {GITHUB_TOKEN}'

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(f'https://api.github.com{path}', headers=headers, params=params)

        if response.status_code == 429:
            raise HTTPException(status_code=429, detail='GitHub rate limit reached. Try again later or configure GITHUB_TOKEN.')
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail='GitHub access is unauthorized. Check the repository visibility and token configuration.')
        if response.status_code == 403:
            raise HTTPException(status_code=403, detail='GitHub rejected the repository request. Check your token or try again later.')
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail='Repository not found on GitHub.')
        if response.status_code >= 400:
            detail = response.text[:200] if response.text else 'GitHub request failed.'
            raise HTTPException(status_code=400, detail=detail)

        return response.json()


def normalize_repo_url(raw_url: str) -> tuple[str, str]:
    value = (raw_url or '').strip()
    if not value:
        raise HTTPException(status_code=400, detail='A GitHub repository URL is required.')

    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or parsed.netloc.lower() not in {'github.com', 'www.github.com'}:
        raise HTTPException(status_code=400, detail='Invalid GitHub URL. Use a public repository like https://github.com/{owner}/{repo}.')

    path_parts = [part for part in parsed.path.split('/') if part]
    if len(path_parts) < 2:
        raise HTTPException(status_code=400, detail='Invalid GitHub URL. Use a public repository like https://github.com/{owner}/{repo}.')

    owner, repo = path_parts[:2]
    if not owner or not repo:
        raise HTTPException(status_code=400, detail='Invalid GitHub URL. Use a public repository like https://github.com/{owner}/{repo}.')

    repo = repo.removesuffix('.git')
    return owner, repo


def infer_language_from_path(path: str) -> str:
    name = path.lower()
    if name.endswith('.tsx'):
        return 'TSX'
    if name.endswith('.ts'):
        return 'TS'
    if name.endswith('.jsx'):
        return 'JSX'
    if name.endswith('.js'):
        return 'JS'
    if name.endswith('.py'):
        return 'Python'
    if name.endswith('.md'):
        return 'Markdown'
    if name.endswith('.json'):
        return 'JSON'
    if name.endswith('.yml') or name.endswith('.yaml'):
        return 'YAML'
    if name.endswith('.toml'):
        return 'TOML'
    if name.endswith('.lock'):
        return 'Lockfile'
    if name.endswith('.css'):
        return 'CSS'
    if name.endswith('.html'):
        return 'HTML'
    if name.endswith('.sql'):
        return 'SQL'
    if name.endswith('.rs'):
        return 'Rust'
    if name.endswith('.go'):
        return 'Go'
    if name.endswith('.sh'):
        return 'Shell'
    if name.endswith('.dockerfile') or name.endswith('dockerfile'):
        return 'Docker'
    return 'Text'


def normalize_tree(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    seen: set[str] = set()

    for entry in entries:
        path = entry.get('path', '')
        if not path or not isinstance(path, str):
            continue
        normalized = path.strip().replace('\\', '/')
        if not normalized or normalized.startswith('/'):
            continue
        if any(prefix in normalized.lower() for prefix in IGNORED_PREFIXES):
            continue
        if normalized.lower().startswith('docs/') and normalized.lower().endswith('.md'):
            pass
        name = Path(normalized).name.lower()
        basename = Path(normalized).name

        include = False
        if basename.lower() in IMPORTANT_FILES:
            include = True
        elif any(normalized.lower().startswith(prefix) for prefix in SOURCE_ROOTS):
            include = True
        elif normalized.lower().endswith(('.ts', '.tsx', '.js', '.jsx', '.py', '.md', '.json', '.yaml', '.yml', '.toml', '.sql')):
            include = True

        if not include:
            continue

        if normalized in seen:
            continue
        seen.add(normalized)

        size = int(entry.get('size', 0) or 0)
        selected.append({
            'path': normalized,
            'name': basename,
            'extension': Path(normalized).suffix.lower().replace('.', ''),
            'size': size,
            'language': infer_language_from_path(normalized),
        })

    selected.sort(key=lambda item: (0 if item['path'].lower().endswith('readme.md') else 1, item['path'].lower()))
    return selected[:60]


async def fetch_selected_files(owner: str, repo: str, branch: str, selected: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not selected:
        return []

    selected_files: list[dict[str, Any]] = []
    count = 0
    async with httpx.AsyncClient(timeout=20.0) as client:
        for item in selected:
            path = item['path']
            if count >= 12:
                break
            if item['size'] > 120000:
                continue
            url = f'https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}'
            response = await client.get(url, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'RepoLens/1.0'})
            if response.status_code != 200:
                continue
            content = response.json()
            if isinstance(content, dict):
                text = content.get('content', '')
                if isinstance(text, str):
                    selected_files.append({
                        'path': path,
                        'name': item['name'],
                        'extension': item['extension'],
                        'size': item['size'],
                        'language': item['language'],
                        'content': text,
                    })
                    count += 1
    return selected_files


@app.get('/api/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/api/repositories/analyze')
async def analyze_repository(payload: AnalyzeRepositoryRequest) -> dict[str, Any]:
    owner, repo = normalize_repo_url(payload.url)

    repo_data = await github_request(f'/repos/{owner}/{repo}')
    if repo_data.get('private'):
        raise HTTPException(status_code=403, detail='This repository is private. RepoLens only supports public GitHub repositories.')

    default_branch = repo_data.get('default_branch', 'main')
    tree_data = await github_request(f'/repos/{owner}/{repo}/git/trees/{default_branch}', params={'recursive': 1})
    tree_entries = tree_data.get('tree', []) if isinstance(tree_data, dict) else []
    selected_tree = normalize_tree(tree_entries)
    selected_files = await fetch_selected_files(owner, repo, default_branch, selected_tree)
    readme_text = ''
    for candidate in selected_files:
        if candidate['path'].lower().endswith('readme.md'):
            readme_text = candidate.get('content', '')
            break

    technologies = detect_technologies(selected_tree, selected_files)
    health = build_default_health(repo_data)
    capabilities = build_default_capabilities(technologies)
    analysis = await generate_ai_analysis(
        metadata={
            'name': repo_data.get('name'),
            'full_name': repo_data.get('full_name'),
            'owner': repo_data.get('owner', {}).get('login'),
            'description': repo_data.get('description') or 'No description provided.',
            'html_url': repo_data.get('html_url'),
            'language': repo_data.get('language'),
            'stargazers_count': repo_data.get('stargazers_count', 0),
            'forks_count': repo_data.get('forks_count', 0),
            'open_issues_count': repo_data.get('open_issues_count', 0),
            'default_branch': default_branch,
            'topics': repo_data.get('topics', []),
        },
        readme=readme_text,
        technologies=technologies,
        file_tree=selected_tree,
        source_files=selected_files,
    )

    architectural_map = normalize_architecture(analysis.get('architecture', {}), repo_data.get('language'))
    contributions = analysis.get('contributions') or generate_recommendations(
        repo_data,
        technologies,
        selected_tree,
        analysis.get('summary', repo_data.get('description') or 'Public repository evaluation.'),
    )

    return {
        'id': f'{owner}/{repo}',
        'name': repo_data.get('name'),
        'owner': owner,
        'full_name': repo_data.get('full_name'),
        'url': repo_data.get('html_url'),
        'description': repo_data.get('description') or 'No description provided.',
        'is_demo': False,
        'stars': f"{repo_data.get('stargazers_count', 0):,}",
        'updated': 'Updated recently',
        'health': health,
        'technologies': technologies,
        'capabilities': capabilities,
        'summary': analysis.get('summary') or (repo_data.get('description') or 'Public repository evaluation.'),
        'architecture': architectural_map,
        'files': selected_tree,
        'contributions': contributions,
    }


@app.post('/api/contributions/find')
async def find_contributions(payload: ContributionRequest) -> list[dict[str, Any]]:
    repository_url = (payload.repository_url or '').strip()
    analysis = payload.analysis or {}
    if repository_url:
        owner, repo = normalize_repo_url(repository_url)
        repository_url = f'https://github.com/{owner}/{repo}'
    if not analysis:
        raise HTTPException(status_code=400, detail='Repository analysis was not provided.')

    return generate_recommendations(
        {
            'full_name': analysis.get('fullName') or analysis.get('full_name') or repository_url,
            'description': analysis.get('description') or 'Repository analysis request.',
            'language': analysis.get('language') or 'Unknown',
            'html_url': repository_url,
        },
        analysis.get('technologies', []) or [],
        analysis.get('files', []) or [],
        analysis.get('summary') or 'Repository analysis request.',
    )


@app.post('/api/issues/generate')
async def generate_issue(payload: IssueGenerationRequest) -> dict[str, Any]:
    contribution = payload.contribution or {}
    return generate_issue_from_contribution(contribution)


@app.get('/')
def root() -> dict[str, str]:
    return {'status': 'ok'}
