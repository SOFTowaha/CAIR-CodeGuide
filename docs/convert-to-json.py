#!/usr/bin/env python3
"""
Convert CAIR Code Guide markdown files to JSON database
"""
import json
import os
from pathlib import Path

# Define the source directory
SOURCE_DIR = Path("../CAIR-CodeGuide.wiki")
OUTPUT_FILE = Path("data/codeguide.json")

# Define the structure and order of chapters
CHAPTERS = [
    {
        "id": "home",
        "title": "Home",
        "filename": "Home.md",
        "order": 0
    },
    {
        "id": "introduction",
        "title": "Introduction",
        "filename": "1.-Introduction.md",
        "order": 1
    },
    {
        "id": "core-coding-principles",
        "title": "Core Coding Principles",
        "filename": "2.-Core-Coding-Principles.md",
        "order": 2
    },
    {
        "id": "code-style-and-formatting",
        "title": "Code Style and Formatting",
        "filename": "3.-Code-Style-and-Formatting.md",
        "order": 3
    },
    {
        "id": "variable-naming",
        "title": "Variable Naming Conventions",
        "filename": "4.-Variable-Naming-Conventions.md",
        "order": 4
    },
    {
        "id": "functions-and-methods",
        "title": "Functions and Methods",
        "filename": "5.-Functions-and-Methods.md",
        "order": 5
    },
    {
        "id": "control-structures",
        "title": "Control Structures",
        "filename": "6.-Control-Structures.md",
        "order": 6
    },
    {
        "id": "oop",
        "title": "Object-Oriented Design",
        "filename": "7.-Object‐Oriented-Design.md",
        "order": 7
    },
    {
        "id": "error-handling",
        "title": "Error Handling and Logging",
        "filename": "8.-Error-Handling-and-Logging.md",
        "order": 8
    },
    {
        "id": "security",
        "title": "Security Best Practices",
        "filename": "9.-Security-Best-Practices.md",
        "order": 9
    },
    {
        "id": "performance",
        "title": "Performance and Optimization",
        "filename": "10.-Performance-and-Optimization.md",
        "order": 10
    },
    {
        "id": "infrastructure",
        "title": "Infrastructure",
        "filename": "11.-Infrastructure.md",
        "order": 11
    },
    {
        "id": "documentation",
        "title": "Documentation Practices",
        "filename": "12.-Documentation-Practices.md",
        "order": 12
    },
    {
        "id": "api-documentation",
        "title": "API Documentation",
        "filename": "13.-API-Documentation.md",
        "order": 13
    },
    {
        "id": "code-review",
        "title": "Code Review Guidelines",
        "filename": "14.-Code-Review-Guidelines.md",
        "order": 14
    },
    {
        "id": "appendix",
        "title": "Appendix and References",
        "filename": "15.-Appendix-and-References.md",
        "order": 15
    },
    {
        "id": "cair-coding-guide",
        "title": "CAIR Coding Guide",
        "filename": "CAIR-Coding-Guide.md",
        "order": 16
    }
]

def read_markdown_file(filepath):
    """Read a markdown file and return its content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

def main():
    """Main function to convert markdown to JSON"""
    guide_data = {
        "title": "CAIR Coding Guide",
        "version": "1.0.0",
        "lastUpdated": "2025-11-23",
        "chapters": []
    }
    
    for chapter in CHAPTERS:
        filepath = SOURCE_DIR / chapter["filename"]
        content = read_markdown_file(filepath)
        
        chapter_data = {
            "id": chapter["id"],
            "title": chapter["title"],
            "order": chapter["order"],
            "content": content
        }
        
        guide_data["chapters"].append(chapter_data)
        print(f"Processed: {chapter['title']}")
    
    # Write to JSON file
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(guide_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Successfully created {OUTPUT_FILE}")
    print(f"  Total chapters: {len(guide_data['chapters'])}")
    print(f"  Output size: {os.path.getsize(OUTPUT_FILE) / 1024:.2f} KB")

if __name__ == "__main__":
    main()
