
from statemachine.embeddings.model import populate


def main():
    placeholderPath = "/Users/jakakrajnc/Code/python/multiagent-rag-system/backend/tools/epub_parser/data/mastering-go.epub"
    populate(placeholderPath)


if __name__ == "__main__":
    main()
