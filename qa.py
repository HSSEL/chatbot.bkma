from langchain_community.llms import Ollama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from pdf_utils import load_pdf

def perform_qa(pdf_file_path, question, ollama_model, base_url):
    llm = Ollama(base_url=base_url, model=ollama_model, temperature=0)
    documents = load_pdf(pdf_file_path)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    splits = text_splitter.split_documents(documents)
    embeddings = OllamaEmbeddings(base_url=base_url, model=ollama_model)
    vectorstore = FAISS.from_documents(splits, embeddings)
    retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 2})
    qa_chain = RetrievalQA.from_llm(llm=llm, retriever=retriever)
    return qa_chain.invoke(question)["result"]