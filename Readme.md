# Catalog App

## Getting Started

Follow these instructions to get the project up and running.

### Prerequisites

- [Node.js >= 20](https://nodejs.org/) installed (or nix)
### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-project.git 
   ```
2. Cd into the folder
    Install dependencies:
    ```bash
        npm install --no-package-lock # installs yarn
        yarn
    ```
3. Compile the project to dist/
    ```bash
        yarn build
    ```
4. Run the server
    ```bash
        yarn express
    ```
### Server
The server will be running at `http://localhost:PORT`
You must replace PORT with the one in the `.env` file.

### .env
Copy the versioned .env.example file to .env, and change it accordingly

### Test
Test are based on builtin Node's testing suite (starting from node 20) <br>
Run the tests with:
```bash
    yarn test # build the test
    yarn run-test {args} dist-test/path_to_folder
```
By **Default** all file named `Test` will be run
