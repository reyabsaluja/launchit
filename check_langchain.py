import sys
import os
import json

def main() -> int:
    try:
        import langchain
        try:
            from langchain_core.runnables import RunnableLambda  # LC >= 0.1 style
        except Exception:
            from langchain.schema.runnable import RunnableLambda  # type: ignore
        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import StrOutputParser
        except Exception as e:
            print("LangChain core import failed:\n" + str(e))
            return 1
        try:
            from langchain_cohere import ChatCohere
        except Exception as e:
            print("langchain-cohere import failed:\n" + str(e))
            return 1
    except Exception as e:
        print("LangChain import failed:\n" + str(e))
        return 1

    print(f"Python executable: {sys.executable}")
    print(f"LangChain version: {getattr(langchain, '__version__', 'unknown')}")

    # Simple no-API chain: take a list of strings, uppercase, and add length
    def transform(items):
        if not isinstance(items, list):
            raise TypeError("Input must be a list of strings")
        result = []
        for item in items:
            text = str(item)
            result.append({
                "original": text,
                "upper": text.upper(),
                "length": len(text)
            })
        return result

    chain = RunnableLambda(transform)
    sample_input = ["hello", "langchain", "works!"]
    try:
        output = chain.invoke(sample_input)
    except Exception as e:
        print("LangChain runnable failed:\n" + str(e))
        return 2

    print("Sample runnable output:")
    print(json.dumps(output, indent=2))

    # --- Cohere-backed agents ---
    api_key = os.getenv("4KBkpJ2gzuSXqeisyjT7F7eOHHAPJIwyDCV1ii3o", "")
    if not api_key:
        print("Warning: COHERE_API_KEY not set; Cohere-backed agents will likely fail.")

    def create_cohere_llm():
        # Try a capable model, fallback if access denied
        for model_name in ("command-r-plus", "command-r", "command"):
            try:
                return ChatCohere(cohere_api_key=api_key or None, model=model_name, temperature=0.2)
            except Exception:
                continue
        return ChatCohere(cohere_api_key=api_key or None, temperature=0.2)

    llm = None
    try:
        llm = create_cohere_llm()
    except Exception as e:
        print("Failed to initialize Cohere LLM:\n" + str(e))
        return 3

    def run_customer_support_agent():
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful, concise customer support agent for {product}. Provide clear, step-by-step guidance and suggest next actions."),
            ("human", "Customer question: {question}")
        ])
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({
            "product": "Acme Smart Thermostat",
            "question": "My thermostat keeps disconnecting from Wi‑Fi. How do I fix it?"
        })

    def run_social_media_agent():
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a creative social media strategist. Write engaging, on-brand content with a strong hook, clear value, and a call to action. Maintain the requested tone and include relevant hashtags sparingly."),
            ("human", "Platform: {platform}\nBrand: {brand}\nTone: {tone}\nTopic: {topic}\nGenerate 1 short post.")
        ])
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({
            "platform": "LinkedIn",
            "brand": "Acme Energy",
            "tone": "professional, optimistic",
            "topic": "Launching our new AI-powered energy-saving thermostat"
        })

    def run_code_writer_agent():
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a senior software engineer. Output only valid code in the requested language, with a brief docstring. Avoid extra commentary."),
            ("human", "Language: {language}\nTask: {task}\nConstraints: simple, readable, handle edge cases. Output code only.")
        ])
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({
            "language": "python",
            "task": "Implement a function `group_anagrams(words: list[str]) -> list[list[str]]` that groups words that are anagrams. Preserve input order within groups."
        })

    print("\n--- Customer Support Agent ---")
    try:
        print(run_customer_support_agent())
    except Exception as e:
        print("Customer Support Agent failed:\n" + str(e))

    print("\n--- Social Media Agent ---")
    try:
        print(run_social_media_agent())
    except Exception as e:
        print("Social Media Agent failed:\n" + str(e))

    print("\n--- Code Writer Agent ---")
    try:
        print(run_code_writer_agent())
    except Exception as e:
        print("Code Writer Agent failed:\n" + str(e))
    return 0


if __name__ == "__main__":
    sys.exit(main())


