TechMentor/
├── backend/
│   ├── pyproject.toml       # Poetry configuration file
│   ├── server/              # FastAPI server package
│   │   ├── main.py          # Entry point for your FastAPI application
│   │   ├── __init__.py      # Initialize the server package
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── endpoints.py
│   │   │   │   ├── chain_endpoints.py
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── session.py
│   │   │   ├── migrations/
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── user_service.py
│   │   │   ├── chain_service.py
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── user_repository.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── pydantic_schema.py
│   │   │   ├── chain_schema.py
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   ├── tests/
│   │       ├── __init__.py
│   │       ├── conftest.py
│   │       ├── test_main.py
│   │       ├── test_api/
│   │           ├── __init__.py
│   │           ├── test_v1/
│   │               ├── __init__.py
│   │               ├── test_endpoints.py
│   │               ├── test_chain_endpoints.py
│   │               ├── test_models.py
│   ├── langchain/           # LangChain package
│   │   ├── main.py          # Entry point for your LangChain application
│   │   ├── __init__.py      # Initialize the langchain package
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── chain_config.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── chain_service.py
│   │   ├── tests/
│   │       ├── __init__.py
│   │       ├── conftest.py
│   │       ├── test_main.py
│   └── README.md            # Project documentation
├── frontend/
│   ├── nextjs-app/
│   │   ├── pages/
│   │   ├── public/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── ...
├── services/
│   ├── go-service/
│   │   ├── cmd/
│   │   ├── pkg/
│   │   ├── Dockerfile
│   │   ├── go.mod
│   │   └── ...
└── README.md
