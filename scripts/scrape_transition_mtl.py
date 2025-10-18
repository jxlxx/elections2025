#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scrape Transition Montréal policy pages into one Markdown file.

Output format:

# Name: <friendly name>
URL: <url>

## In just a few sentences...
<summary>

## [SUBHEADING]
<content>

(repeat for all subheadings)
"""

import re
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

# Optional: better HTML->MD if installed
try:
    import markdownify as mdify

    def html_to_md(html: str) -> str:
        return mdify.markdownify(
            html,
            heading_style="ATX",
            bullets="*",
            strip=["script", "style"],
        ).strip()
except Exception:
    # Minimal fallback
    def html_to_md(html: str) -> str:
        soup = BeautifulSoup(html, "html.parser")
        # Convert <br> to newlines
        for br in soup.find_all("br"):
            br.replace_with("\n")
        # Convert links to "text (url)"
        for a in soup.find_all("a"):
            text = a.get_text(" ", strip=True)
            href = a.get("href", "")
            a.replace_with(f"{text} ({href})" if href else text)
        # Convert list items
        for ul in soup.find_all(["ul", "ol"]):
            lines = []
            li_tags = ul.find_all("li", recursive=False)
            for li in li_tags:
                lines.append(f"* {li.get_text(' ', strip=True)}")
            ul.replace_with("\n".join(lines))
        # Paragraphs to text with blank lines
        for p in soup.find_all("p"):
            p.insert_after(soup.new_string("\n\n"))
        text = soup.get_text("\n", strip=True)
        # Squeeze excessive blank lines
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()


HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) TransitionScraper/1.0 (+script)"
}

URLS = [
    ("Divesting from genocide", "https://www.transitionmtl.org/desinvestissement"),
    ("Ambitious mass transit", "https://www.transitionmtl.org/transport-collectif"),
    ("Ambitious municipal electoral reform", "https://www.transitionmtl.org/reforme-electorale"),
    ("Public safety centered on dignity", "https://www.transitionmtl.org/securite-publique"),
    ("A safe environment around schools", "https://www.transitionmtl.org/securite-autour-ecoles"),
    ("A protected nightlife", "https://www.transitionmtl.org/vie-nocturne-protegee"),
    ("A public and community food market", "https://www.transitionmtl.org/marche-alimentaire-public-communautaire"),
    ("Social pricing for public transit", "https://www.transitionmtl.org/tarification-sociale-transports"),
    ("A taskforce for simple public works: Infra-Montréal", "https://www.transitionmtl.org/escouade-travaux-publics-infra-montreal"),
    ("A tax on the ultra-wealthy", "https://www.transitionmtl.org/taxe-ultras-riches"),
]

OUTFILE = Path("transition_mtl_platform.md")


def fetch(url: str) -> BeautifulSoup:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")


def get_meta_description(soup: BeautifulSoup) -> str | None:
    # Try standard meta descriptions
    for selector in [
        'meta[name="description"]',
        'meta[name="Description"]',
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
    ]:
        tag = soup.select_one(selector)
        if tag and tag.get("content"):
            desc = tag["content"].strip()
            if desc:
                return desc
    return None


def get_first_paragraph(soup: BeautifulSoup) -> str | None:
    # Heuristic: first <p> before first h2/h3 or the first significant <p>
    paras = [p for p in soup.find_all("p") if p.get_text(strip=True)]
    return paras[0].get_text(" ", strip=True) if paras else None


def summarise_in_few_sentences(text: str, max_sentences: int = 3) -> str:
    # Very light sentence split
    # Keep up to ~3 sentences or fall back to the whole string if short.
    parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÉÈÊÀÂÎÔÛÇa-z0-9])", text.strip())
    if len(parts) > max_sentences:
        parts = parts[:max_sentences]
    return " ".join(parts).strip()


def iter_sections(soup: BeautifulSoup):
    """
    Yield (heading_text, html_content) for each H2/H3 section.

    We walk the DOM: for every h2/h3, collect sibling nodes until the next h2/h3.
    """
    headings = soup.find_all(["h2", "h3"])
    for i, h in enumerate(headings):
        title = h.get_text(" ", strip=True)
        # Collect content until next heading of the same set
        contents = []
        sibling = h.next_sibling
        stop_tags = ("h2", "h3")
        while sibling:
            if isinstance(sibling, Tag) and sibling.name in stop_tags:
                break
            if isinstance(sibling, (Tag, NavigableString)):
                # Skip empty strings or purely whitespace
                textish = str(sibling).strip()
                if textish:
                    contents.append(str(sibling))
            sibling = sibling.next_sibling
        yield title, "\n".join(contents).strip()


def clean_heading(h: str) -> str:
    # Keep as-is but strip excessive whitespace
    return re.sub(r"\s+", " ", h).strip()


def main():
    chunks = []
    for friendly_name, url in URLS:
        try:
            soup = fetch(url)

            # Summary source: meta description else first paragraph
            summary = get_meta_description(soup) or get_first_paragraph(soup) or ""
            summary = summarise_in_few_sentences(summary, max_sentences=3)

            # Collect sections
            sections = list(iter_sections(soup))

            # Build markdown
            md = []
            md.append(f"# Name: {friendly_name}")
            md.append(f"URL: {url}\n")
            # md.append("## In just a few sentences...\n")
            
            md.append(html_to_md(summary))

            # Write all sections
            if not sections:
                # If site uses different structure, fallback to main content
                main_body = soup.body or soup
                # md.append("## [CONTENT]\n")
                md.append(html_to_md(str(main_body)))
            else:
                for title, html in sections:
                    title = clean_heading(title)
                    # if not title:
                        # continue
                    md.append(title)
                    # md.append(html_to_md(html) if html else "_(No content under this heading.)_")
                    md.append(html_to_md(html))

            md.append("\n---\n")
            chunks.append("\n".join(md))

            print(f"[ok] Scraped: {friendly_name} -> {url}")

        except Exception as e:
            err = f"[fail] {friendly_name} -> {url}: {e}"
            print(err, file=sys.stderr)
            chunks.append(
                f"# Name: {friendly_name}\nURL: {url}\n\n"
                "## In just a few sentences...\n_(Error scraping this page — fill manually.)_\n\n"
                "## [CONTENT]\n_(No content scraped due to error.)_\n\n---\n"
            )

    OUTFILE.write_text("\n".join(chunks), encoding="utf-8")
    print(f"\nWrote: {OUTFILE.resolve()}")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scrape Transition Montréal policy pages into one Markdown file.

Output format:

# Name: <friendly name>
URL: <url>

## In just a few sentences...
<summary>

## [SUBHEADING]
<content>

(repeat for all subheadings)
"""

# import re
# import sys
# from pathlib import Path

# import requests
# from bs4 import BeautifulSoup, NavigableString, Tag

# # Optional: better HTML->MD if installed
# try:
#     import markdownify as mdify

#     def html_to_md(html: str) -> str:
#         return mdify.markdownify(
#             html,
#             heading_style="ATX",
#             bullets="*",
#             strip=["script", "style"],
#         ).strip()
# except Exception:
#     # Minimal fallback
#     def html_to_md(html: str) -> str:
#         soup = BeautifulSoup(html, "html.parser")
#         # Convert <br> to newlines
#         for br in soup.find_all("br"):
#             br.replace_with("\n")
#         # Convert links to "text (url)"
#         for a in soup.find_all("a"):
#             text = a.get_text(" ", strip=True)
#             href = a.get("href", "")
#             a.replace_with(f"{text} ({href})" if href else text)
#         # Convert list items
#         for ul in soup.find_all(["ul", "ol"]):
#             lines = []
#             li_tags = ul.find_all("li", recursive=False)
#             for li in li_tags:
#                 lines.append(f"* {li.get_text(' ', strip=True)}")
#             ul.replace_with("\n".join(lines))
#         # Paragraphs to text with blank lines
#         for p in soup.find_all("p"):
#             p.insert_after(soup.new_string("\n\n"))
#         text = soup.get_text("\n", strip=True)
#         # Squeeze excessive blank lines
#         text = re.sub(r"\n{3,}", "\n\n", text)
#         return text.strip()


# HEADERS = {
#     "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) TransitionScraper/1.0 (+script)"
# }

# URLS = [
#     ("Divesting from genocide", "https://www.transitionmtl.org/desinvestissement"),
#     ("Ambitious mass transit", "https://www.transitionmtl.org/transport-collectif"),
#     ("Ambitious municipal electoral reform", "https://www.transitionmtl.org/reforme-electorale"),
#     ("Public safety centered on dignity", "https://www.transitionmtl.org/securite-publique"),
#     ("A safe environment around schools", "https://www.transitionmtl.org/securite-autour-ecoles"),
#     ("A protected nightlife", "https://www.transitionmtl.org/vie-nocturne-protegee"),
#     ("A public and community food market", "https://www.transitionmtl.org/marche-alimentaire-public-communautaire"),
#     ("Social pricing for public transit", "https://www.transitionmtl.org/tarification-sociale-transports"),
#     ("A taskforce for simple public works: Infra-Montréal", "https://www.transitionmtl.org/escouade-travaux-publics-infra-montreal"),
#     ("A tax on the ultra-wealthy", "https://www.transitionmtl.org/taxe-ultras-riches"),
# ]

# OUTFILE = Path("transition_mtl_platform.md")


# def fetch(url: str) -> BeautifulSoup:
#     r = requests.get(url, headers=HEADERS, timeout=30)
#     r.raise_for_status()
#     return BeautifulSoup(r.text, "html.parser")


# def get_meta_description(soup: BeautifulSoup) -> str | None:
#     # Try standard meta descriptions
#     for selector in [
#         'meta[name="description"]',
#         'meta[name="Description"]',
#         'meta[property="og:description"]',
#         'meta[name="twitter:description"]',
#     ]:
#         tag = soup.select_one(selector)
#         if tag and tag.get("content"):
#             desc = tag["content"].strip()
#             if desc:
#                 return desc
#     return None


# def get_first_paragraph(soup: BeautifulSoup) -> str | None:
#     # Heuristic: first <p> before first h2/h3 or the first significant <p>
#     paras = [p for p in soup.find_all("p") if p.get_text(strip=True)]
#     return paras[0].get_text(" ", strip=True) if paras else None


# def summarise_in_few_sentences(text: str, max_sentences: int = 3) -> str:
#     # Very light sentence split
#     # Keep up to ~3 sentences or fall back to the whole string if short.
#     parts = re.split(r"(?<=[.!?])\s+(?=[A-ZÉÈÊÀÂÎÔÛÇa-z0-9])", text.strip())
#     if len(parts) > max_sentences:
#         parts = parts[:max_sentences]
#     return " ".join(parts).strip()


# def iter_sections(soup: BeautifulSoup):
#     """
#     Yield (heading_text, html_content) for each H2/H3 section.

#     We walk the DOM: for every h2/h3, collect sibling nodes until the next h2/h3.
#     """
#     headings = soup.find_all(["h2", "h3"])
#     for i, h in enumerate(headings):
#         title = h.get_text(" ", strip=True)
#         # Collect content until next heading of the same set
#         contents = []
#         sibling = h.next_sibling
#         stop_tags = ("h2", "h3")
#         while sibling:
#             if isinstance(sibling, Tag) and sibling.name in stop_tags:
#                 break
#             if isinstance(sibling, (Tag, NavigableString)):
#                 # Skip empty strings or purely whitespace
#                 textish = str(sibling).strip()
#                 if textish:
#                     contents.append(str(sibling))
#             sibling = sibling.next_sibling
#         yield title, "\n".join(contents).strip()


# def clean_heading(h: str) -> str:
#     # Keep as-is but strip excessive whitespace
#     return re.sub(r"\s+", " ", h).strip()


# def main():
#     chunks = []
#     for friendly_name, url in URLS:
#         try:
#             soup = fetch(url)

#             # Summary source: meta description else first paragraph
#             summary = get_meta_description(soup) or get_first_paragraph(soup) or ""
#             summary = summarise_in_few_sentences(summary, max_sentences=3)

#             # Collect sections
#             sections = list(iter_sections(soup))

#             # Build markdown
#             md = []
#             md.append(f"# Name: {friendly_name}")
#             md.append(f"URL: {url}\n")
#             # md.append("## In just a few sentences...\n")
#             md.append(html_to_md(summary) if summary else "_(No short summary detected — see sections below.)_\n")

#             # Write all sections
#             if not sections:
#                 # If site uses different structure, fallback to main content
#                 main_body = soup.body or soup
#                 md.append("## [CONTENT]\n")
#                 md.append(html_to_md(str(main_body)))
#             else:
#                 for title, html in sections:
#                     title = clean_heading(title)
#                     if not title:
#                         continue
#                     md.append(f"## [{title}]\n")
#                     md.append(html_to_md(html) if html else "_(No content under this heading.)_")

#             md.append("\n---\n")
#             chunks.append("\n".join(md))

#             print(f"[ok] Scraped: {friendly_name} -> {url}")

#         except Exception as e:
#             err = f"[fail] {friendly_name} -> {url}: {e}"
#             print(err, file=sys.stderr)
#             chunks.append(
#                 f"# Name: {friendly_name}\nURL: {url}\n\n"
#                 "## In just a few sentences...\n_(Error scraping this page — fill manually.)_\n\n"
#                 "## [CONTENT]\n_(No content scraped due to error.)_\n\n---\n"
#             )

#     OUTFILE.write_text("\n".join(chunks), encoding="utf-8")
#     print(f"\nWrote: {OUTFILE.resolve()}")


# if __name__ == "__main__":
#     main()
