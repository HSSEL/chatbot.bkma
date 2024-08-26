# web_search.py

import asyncio
from duckduckgo_search import DDGS
from bs4 import BeautifulSoup
from aiohttp import ClientSession, ClientTimeout
import requests

class SearchResults():
    def __init__(self, results: list):
        self.results = results

    def __iter__(self):
        yield from self.results

    def __str__(self):
        search = ""
        for idx, result in enumerate(self.results):
            if search:
                search += "\n\n\n"
            search += f"Title: {result.title}\n\n"
            if result.text:
                search += result.text
            else:
                search += result.snippet
            search += f"\n\nSource: [[{idx}]]({result.url})"
        return search

class SearchResultEntry():
    def __init__(self, title: str, url: str, snippet: str, text: str = None):
        self.title = title
        self.url = url
        self.snippet = snippet
        self.text = text

    def set_text(self, text: str):
        self.text = text

def scrape_text(html: str, max_words: int = None) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for exclude in soup(["script", "style"]):
        exclude.extract()
    for selector in [
            "main",
            ".main-content-wrapper",
            ".main-content",
            ".emt-container-inner",
            ".content-wrapper",
            "#content",
            "#mainContent",
        ]:
        select = soup.select_one(selector)
        if select:
            soup = select
            break
    for remove in [".c-globalDisclosure"]:
        select = soup.select_one(remove)
        if select:
            select.extract()
    clean_text = ""
    for paragraph in soup.select("p"):
        text = paragraph.get_text()
        for line in text.splitlines():
            words = []
            for word in line.replace("\t", " ").split(" "):
                if word:
                    words.append(word)
            count = len(words)
            if not count:
                continue
            if max_words:
                max_words -= count
                if max_words <= 0:
                    break
            if clean_text:
                clean_text += "\n"
            clean_text += " ".join(words)

    return clean_text

async def fetch_and_scrape(session: ClientSession, url: str, max_words: int = None) -> str:
    try:
        async with session.get(url) as response:
            if response.status == 200:
                html = await response.text()
                return scrape_text(html, max_words)
    except:
        return

async def search_web(query: str, n_results: int = 5, max_words: int = 2500, add_text: bool = True) -> SearchResults:
    with DDGS() as ddgs:
        results = []
        for result in ddgs.text(
                query,
                region="wt-wt",
                safesearch="moderate",
                timelimit="y",
            ):
            results.append(SearchResultEntry(
                result["title"],
                result["href"],
                result["body"]
            ))
            if len(results) >= n_results:
                break

        if add_text:
            requests = []
            async with ClientSession(timeout=ClientTimeout(5)) as session:
                for entry in results:
                    requests.append(fetch_and_scrape(session, entry.url, int(max_words / (n_results - 1))))
                texts = await asyncio.gather(*requests)

        formatted_results = []
        left_words = max_words
        for i, entry in enumerate(results):
            if add_text:
                entry.text = texts[i]
            if left_words:
                left_words -= entry.title.count(" ") + 5
                if entry.text:
                    left_words -= entry.text.count(" ")
                else:
                    left_words -= entry.snippet.count(" ")
                if 0 > left_words:
                    break
            formatted_results.append(entry)

        return SearchResults(formatted_results)

def search_url_content(url: str) -> str:
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad status codes
        html = response.text

        # Use BeautifulSoup to extract text
        soup = BeautifulSoup(html, 'html.parser')
        for exclude in soup(['script', 'style']):
            exclude.decompose()
        text = soup.get_text()
        return text.strip()
    except Exception as e:
        return f"An error occurred: {str(e)}"
