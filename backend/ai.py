import json
import os
from typing import Any

import httpx


def detect_technologies(file_tree: list[dict[str, Any]], source_files: list[dict[str, Any]]) -> list[dict[str, Any]]:
    paths = [item.get('path', '').lower() for item in file_tree]
    contents = '\n'.join((item.get('content', '') or '').lower() for item in source_files)

    technology_map = [
        ('React', 'frontend', 'package.json', 'react'),
        ('Next.js', 'frontend', 'package.json', 'next'),
        ('Express', 'backend', 'package.json', 'express'),
        ('FastAPI', 'backend', 'requirements.txt', 'fastapi'),
        ('Django', 'backend', 'requirements.txt', 'django'),
        ('Flask', 'backend', 'requirements.txt', 'flask'),
        ('Python', 'language', 'pyproject.toml', 'python'),
        ('Rust', 'language', 'cargo.toml', 'rust'),
        ('Go', 'language', 'go.mod', 'module'),
        ('PostgreSQL', 'data', 'package.json', 'postgres')
    ]

    detected: list[dict[str, Any]] = []
    for name, category, _, keyword in technology_map:
        if any(path.endswith(_file) for path, _file in [(p, 'package.json') for p in paths]) and 'package.json' in paths and keyword in contents:
            detected.append({'name': name, 'category': category})
        elif keyword in contents:
            detected.append({'name': name, 'category': category})
        elif any(path.endswith('package.json') for path in paths) and name == 'React' and 'react' in ''.join(paths):
            detected.append({'name': name, 'category': category})
        elif any(path.endswith('requirements.txt') for path in paths) and name in {'FastAPI', 'Django', 'Flask'}:
            detected.append({'name': name, 'category': category})

    unique: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in detected:
        key = item['name']
        if key not in seen:
            seen.add(key)
            unique.append(item)

    if not unique:
        unique.append({'name': 'TypeScript', 'category': 'language'})
    return unique


def build_default_health(repo_metadata: dict[str, Any]) -> list[dict[str, Any]]:
    language = repo_metadata.get('language') or 'TypeScript'
    stars = repo_metadata.get('stargazers_count', 0)
    forks = repo_metadata.get('forks_count', 0)
    issues = repo_metadata.get('open_issues_count', 0)
    return [
        {'label': 'Languages', 'value': language, 'detail': f'{stars} stars', 'icon': 'code', 'tone': 'violet'},
        {'label': 'Forks', 'value': str(forks), 'detail': 'Repository activity', 'icon': 'box', 'tone': 'blue'},
        {'label': 'Open issues', 'value': str(issues), 'detail': 'Community signals', 'icon': 'file', 'tone': 'mint'},
        {'label': 'Default branch', 'value': repo_metadata.get('default_branch', 'main'), 'detail': 'Primary branch', 'icon': 'check', 'tone': 'amber'},
    ]


def build_default_capabilities(technologies: list[dict[str, Any]]) -> list[dict[str, Any]]:
    feature_names = [item.get('name', 'Repository') for item in technologies]
    mapped = []
    for index, name in enumerate(feature_names[:4]):
        mapped.append({'name': name, 'summary': f'{name} is part of the repository’s implementation footprint.', 'icon': 'sparkles', 'status': 'mapped'})
    if not mapped:
        mapped.append({'name': 'Repository', 'summary': 'Core project structure has been processed.', 'icon': 'sparkles', 'status': 'mapped'})
    return mapped


def normalize_architecture(architecture: dict[str, Any] | None, primary_language: str | None) -> dict[str, Any]:
    base = architecture or {}
    nodes = base.get('nodes') or [
        {'id': 'frontend', 'label': 'Frontend', 'subtitle': primary_language or 'Repository', 'category': 'layer', 'x': 100, 'y': 110, 'color': '#5BC0EB', 'purpose': 'User-facing application shell and views.', 'usedBy': ['Repository'], 'dependencies': [primary_language or 'Code']},
        {'id': 'service', 'label': 'API layer', 'subtitle': 'Interfaces', 'category': 'layer', 'x': 430, 'y': 110, 'color': '#8B5CF6', 'purpose': 'Repository metadata and contribution orchestration.', 'usedBy': ['Frontend'], 'dependencies': ['GitHub API', 'AI analysis']},
        {'id': 'repo', 'label': 'Repository', 'subtitle': 'Codebase', 'category': 'root', 'x': 260, 'y': 260, 'color': '#7C5CFC', 'purpose': 'Source tree and project signal map.', 'usedBy': ['Frontend', 'API'], 'dependencies': ['Files', 'README', 'metadata']},
    ]
    edges = base.get('edges') or [
        {'id': 'e1', 'from': 'frontend', 'to': 'service', 'label': 'calls'},
        {'id': 'e2', 'from': 'service', 'to': 'repo', 'label': 'reads'},
    ]
    return {'nodes': nodes, 'edges': edges}


def build_summary(metadata: dict[str, Any], technologies: list[dict[str, Any]], file_tree: list[dict[str, Any]]) -> str:
    name = metadata.get('full_name') or metadata.get('name') or 'repository'
    tech_names = ', '.join(item.get('name', '') for item in technologies[:3]) if technologies else 'TypeScript'
    files = len(file_tree)
    return f'{name} is a public repository with {files} meaningful project signals and a technology footprint centered on {tech_names}. The structure suggests a focused, contributor-friendly app with clear entry points and a manageable first contribution path.'


def generate_recommendations(repo_metadata: dict[str, Any], technologies: list[dict[str, Any]], file_tree: list[dict[str, Any]], summary: str) -> list[dict[str, Any]]:
    paths = [item.get('path', '') for item in file_tree]
    repo_name = repo_metadata.get('full_name') or repo_metadata.get('name') or 'repository'
    candidates = [
        {
            'id': 'readme-and-setup',
            'title': 'Clarify local setup and repository onboarding',
            'difficulty': 'beginner',
            'effort': '30–45 minutes',
            'impact': 'medium',
            'risk': 'low',
            'why': 'The repository appears to have a strong structure and entry points, but the contributor startup path is likely the most accessible improvement.',
            'problem': 'New contributors need a clearer onboarding flow so they can understand the exact install and validation steps before making a change.',
            'whereToWork': ['README.md', 'package.json', 'requirements.txt'],
            'implementationPlan': [
                'Review the primary setup scripts and dependency files.',
                'Add installation and validation instructions matching the real toolchain.',
                'Document the expected developer workflow in a contributor-friendly format.'
            ],
            'filesToModify': ['README.md'],
            'filesToUnderstand': ['package.json', 'requirements.txt'],
            'files': ['README.md', 'package.json', 'requirements.txt'],
            'reason': 'This is a low-risk task grounded in the repository root files and contributes to contributor onboarding.',
            'implementation_steps': ['Review setup commands', 'Document prerequisites', 'Verify the flow'],
            'acceptance_criteria': ['README includes setup steps', 'Common commands are easy to follow', 'No undocumented assumptions remain']
        },
        {
            'id': 'dependency-and-tech-docs',
            'title': 'Document the core technology footprint',
            'difficulty': 'beginner',
            'effort': '20–30 minutes',
            'impact': 'low',
            'risk': 'low',
            'why': 'The repository already exposes framework and tool metadata, so a clear technology overview is a realistic, well-scoped improvement.',
            'problem': 'A contributor should be able to identify the major technologies and operational boundaries without reading every config file.',
            'whereToWork': ['README.md', 'package.json', 'pyproject.toml', 'tsconfig.json'],
            'implementationPlan': [
                'List the main frameworks and languages in the repo.',
                'Map them to the relevant runtime and build entry points.',
                'Call out the expected development workflow and constraints.'
            ],
            'filesToModify': ['README.md'],
            'filesToUnderstand': ['package.json', 'tsconfig.json'],
            'files': ['README.md', 'package.json', 'tsconfig.json'],
            'reason': 'This directly matches the detected project tech stack and helps new contributors orient faster.',
            'implementation_steps': ['Review config files', 'Summarize stack', 'Write contributor note'],
            'acceptance_criteria': ['Major technologies are explicitly listed', 'The repo’s runtime model is documented', 'The note matches actual project files']
        },
    ]

    if any(path.lower().endswith('package.json') for path in paths):
        candidates.append({
            'id': 'package-scripts-audit',
            'title': 'Audit package scripts and developer workflow',
            'difficulty': 'beginner',
            'effort': '45–60 minutes',
            'impact': 'medium',
            'risk': 'low',
            'why': 'The project’s package manifest is an obvious place for a contributor to learn the intended workflow and catch any confusion or missing commands.',
            'problem': 'The repository may have script entry points that are not obvious to new contributors or need documentation around validation and local setup.',
            'whereToWork': ['package.json', 'README.md'],
            'implementationPlan': [
                'Review the package manifest for scripts and metadata.',
                'Verify which commands cover local setup, test and build flows.',
                'Document the expected contributor workflow and validate it against the project root.'
            ],
            'filesToModify': ['package.json', 'README.md'],
            'filesToUnderstand': ['package.json'],
            'files': ['package.json', 'README.md'],
            'reason': 'This is rooted in actual package metadata and low risk because it does not alter application logic.',
            'implementation_steps': ['Inspect scripts', 'Document commands', 'Align docs with repo behavior'],
            'acceptance_criteria': ['Scripts are understandable', 'Common workflow is documented', 'No risky runtime changes are introduced']
        })

    final = []
    for idx, item in enumerate(candidates[:4], start=1):
        final.append({
            'id': item['id'],
            'title': item['title'],
            'difficulty': item['difficulty'],
            'effort': item['effort'],
            'impact': item['impact'],
            'filesInvolved': len(item['files']),
            'risk': item['risk'],
            'why': item['why'],
            'problem': item['problem'],
            'whereToWork': item['whereToWork'],
            'implementationPlan': item['implementationPlan'],
            'filesToModify': item['filesToModify'],
            'filesToUnderstand': item['filesToUnderstand'],
            'files': item['files'],
            'reason': item['reason'],
            'implementation_steps': item['implementation_steps'],
            'acceptance_criteria': item['acceptance_criteria'],
        })
    return final


def generate_issue_from_contribution(contribution: dict[str, Any]) -> dict[str, Any]:
    title = contribution.get('title') or 'Improve repository onboarding'
    files = contribution.get('files') or contribution.get('whereToWork') or []
    plan = contribution.get('implementationPlan') or contribution.get('implementation_steps') or []
    return {
        'title': title,
        'description': contribution.get('problem') or 'Improve contributor clarity and reduce friction in this repository.',
        'proposedSolution': contribution.get('why') or 'Document and simplify the contributor workflow around the repository’s real entry points.',
        'implementation': [step for step in plan],
        'acceptanceCriteria': contribution.get('acceptance_criteria') or [
            'The issue is directly tied to repository signals and real files.',
            'The implementation is validated against the project workflow.',
            'Contributor-facing docs or scripts remain easy to follow.'
        ],
        'files': files,
    }


async def generate_ai_analysis(metadata: dict[str, Any], readme: str, technologies: list[dict[str, Any]], file_tree: list[dict[str, Any]], source_files: list[dict[str, Any]]) -> dict[str, Any]:
    if not os.getenv('AI_API_KEY'):
        return {
            'summary': build_summary(metadata, technologies, file_tree),
            'purpose': 'Repository analysis and contributor guidance',
            'architecture_summary': 'The project is organized around a clear frontend and API/service boundary with supporting files that reveal the primary runtime and contributor surfaces.',
            'important_files': [
                {'path': item.get('path', ''), 'purpose': 'Core project entry point', 'importance': 'high'}
                for item in file_tree[:5]
                if item.get('path')
            ],
            'architecture': {'nodes': [], 'edges': []},
            'contributions': generate_recommendations(metadata, technologies, file_tree, build_summary(metadata, technologies, file_tree))
        }

    prompt = {
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': 'Return strict JSON only. The output must match the requested schema with no markdown fences.'},
            {'role': 'user', 'content': json.dumps({
                'metadata': metadata,
                'readme': readme,
                'technologies': technologies,
                'file_tree': file_tree,
                'source_files': source_files[:8],
            }, ensure_ascii=False) }
        ],
        'response_format': {'type': 'json_object'},
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                'https://api.openai.com/v1/chat/completions',
                headers={'Authorization': f"Bearer {os.getenv('AI_API_KEY')}", 'Content-Type': 'application/json'},
                json=prompt,
            )
            if response.status_code >= 400:
                raise ValueError(response.text[:200])
            payload = response.json()
            content = payload.get('choices', [{}])[0].get('message', {}).get('content')
            if not content:
                raise ValueError('Empty AI response.')
            parsed = json.loads(content)
            return parsed
    except Exception:
        return {
            'summary': build_summary(metadata, technologies, file_tree),
            'purpose': 'Repository analysis and contributor guidance',
            'architecture_summary': 'The project is organized around a clear frontend and APIs with supporting documentation and configuration signals.',
            'important_files': [
                {'path': item.get('path', ''), 'purpose': 'Core repository signal', 'importance': 'high'}
                for item in file_tree[:4]
                if item.get('path')
            ],
            'architecture': {'nodes': [], 'edges': []},
            'contributions': generate_recommendations(metadata, technologies, file_tree, build_summary(metadata, technologies, file_tree))
        }
