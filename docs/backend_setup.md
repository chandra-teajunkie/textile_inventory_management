## Backend Developer Setup

This section outlines the steps to set up the backend development environment.

### Prerequisites

*   Python 3.8+
*   [UV](https://github.com/astral-sh/uv): A fast and modern Python package installer and resolver.
*   Git

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <your_repository_url>
    ```

2.  **Navigate to the `backend` directory:**

    ```bash
    cd backend
    ```

3.  **Create a virtual environment using UV:**

    ```bash
    uv venv
    ```

    This command creates a `.venv` directory in the `backend` folder, which will contain the isolated Python environment.

4.  **Activate the virtual environment:**

    *   **On Windows (Command Prompt):**

        ```bash
        .venv\Scripts\activate.bat
        ```

    After activation, your shell prompt will be prefixed with `(.venv)`, indicating that the virtual environment is active.

5.  **Synchronize dependencies using UV:**

    ```bash
    uv sync
    ```

    This command reads the `pyproject.toml` file and installs all the required packages into your virtual environment.

### Running the Application

1.  **Ensure the virtual environment is activated (see step 4 above).**

2.  **Run the FastAPI application:**

    ```bash
    cd "\backend"
    python -m app.main

    ```
    The backend API will now be accessible at `http://127.0.0.1:8000`.
    Go to `http://127.0.0.1:8000/docs` to access the swagger api docs.

### Additional Notes

*   **Database:** The application uses SQLite for local development. The database file (`textile_inventory.db`) will be created automatically when the application first runs.
*   **Pre-commit Hooks:**  This project uses pre-commit hooks to enforce code quality.  See the `.pre-commit-config.yaml` file for details. Run `pre-commit install` to set up the hooks.