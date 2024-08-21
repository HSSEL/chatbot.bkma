from langchain.chains.combine_documents.stuff import StuffDocumentsChain
from langchain.chains.llm import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_community.llms import Ollama
from pdf_utils import load_pdf

def summarize_pdf(pdf_file_path, ollama_model, base_url):
    llm = Ollama(base_url=base_url, model=ollama_model, temperature=0)
    documents = load_pdf(pdf_file_path)
    prompt_template = """Write a concise summary of the following:
    "{text}"
    End the summary with this sentence: "Don't hesitate if you have any other documents to summarize."
    CONCISE SUMMARY:"""
    prompt = PromptTemplate.from_template(prompt_template)
    llm_chain = LLMChain(llm=llm, prompt=prompt)
    stuff_chain = StuffDocumentsChain(llm_chain=llm_chain, document_variable_name="text")
    return stuff_chain.invoke(documents)["output_text"]
