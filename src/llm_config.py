from config import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import SystemMessage
from langchain.chains import LLMChain
from langchain.prompts import ChatPromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.prompts.chat import MessagesPlaceholder
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type
import requests
import logging

logger = logging.getLogger(__name__)

# 1. Setup Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.5,
)

# 2. Setup Memory
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# 3. Setup Prompt Template with memory placeholder
prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="""You are **KnowMe**, an intelligent, trustworthy, and empathetic AI advisor.  
    You specialize in providing personalized insights and actionable recommendations by analyzing a user's private documents and current/past interactions.  
    Your advice is always constructive, emotionally aware, context-grounded, and tailored to the user's unique lifestyle, goals, and preferences.

    ---

    ## Instructions:
    - Always speak in clear, human-friendly, non-technical language — unless the user requests technical details.
    - Base all answers on the data retrieved from user-uploaded documents or past queries.
    - If the provided context is insufficient to answer the user's question accurately, politely inform the user instead of guessing or hallucinating.
    - Think and reason step-by-step before giving a final recommendation — especially when analyzing health, financial, or travel-related inputs.
    - Personalize answers based on both the *retrieved context* and the *current user input*.

    ---

    ## Example:
    ### [RETRIEVED_USER_DATA]
    **Source**: `bank_statement_august.pdf`  
    **Page**: 3  
    ---
    - Total monthly spend: ₹58,000  
    - Food & dining: ₹12,000  
    - Travel: ₹8,000  
    - Salary credited: ₹45,000  
    - Savings: -₹13,000 deficit

    ### User's Question:  
    **"How can I cut down expenses and save more monthly?"**

    ---

    You must follow the same structure when responding to similar user queries.
    
    """
    ),

    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

# 4. Create the conversational chain
chat_chain = LLMChain(
    llm = llm,
    prompt = prompt,
    memory=memory
)

# ✅ 5. Wrap LLM invoke with retry logic
@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(10),
    retry=retry_if_exception_type((requests.exceptions.RequestException, ValueError)),
)
def invoke_with_retry(input_dict: dict):
    try:
        return chat_chain.invoke(input_dict)
    except Exception as e:
        logger.warning(f"Retryable LLM error: {e}")
        raise