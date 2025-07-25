(function() {
    const appendLocation = '#hero';
    const userStorageName = 'users-data';
    const aliveTime = 1000 * 60 * 60 * 24;
    const usersUrl = 'https://jsonplaceholder.typicode.com/users';
    const appendLocationDiv = document.querySelector(appendLocation);

    const classes = {
        style: 'custom-style',
        userListContainer: 'user-list-container',
        error: 'error',
        apiButton: 'api-button',
        headerRow: 'header-row',
        userRow: 'user-row',
        headerCell: 'header-cell',
        row: 'row',
        cell: 'cell',
        deleteButton: 'delete-button',
    };

    const selectors = Object.entries(classes).reduce((obj, [key, value]) => {
        obj[key] = `.${value}`;

        return obj;
    });

    const showError = (target, errorMessage) => {
        const html =
            `<div class="error">
                <p>${errorMessage}</p>
            </div>`;

        target.prepend(html);
    };

    const getUsersData = async (url) => {
        try {
            const response = await fetch(url); 

            if (response.status !== 200) {
                throw new Error(response.status);
            }
        
            const jsonData = await response.json();

            return jsonData;  
        } catch (error) {
            console.error('failed: ', error);

            throw error;
        }  
    };

    const createCustomStyle = () => {
        const { userListContainer, error, headerRow, userRow, headerCell, cell, deleteButton, apiButton,
            insApiUsers } = selectors;

        const customCss =
            `body {
                font-family: Arial, sans-serif;
                background-color: #f9f9ea;
                margin: 20px;
            }
            ${userListContainer} {
                max-width: 800px;
                margin: 0 auto;
                display: table;
                width: 100%;
                border-collapse: collapse;
            }
            ${error}{
                text-align:center;
                color:#ff0000;
                font-weight:bold;
            }
            ${headerRow}, ${userRow} {
                display: table-row;
            }
            ${headerCell}, ${cell} {
                display: table-cell;
                padding: 12px 8px;
                border-bottom: 1px solid #ddd;
                vertical-align: middle;
            }
            ${headerCell} {
                font-weight: bold;
                background: #dddbd5;
                color: #333;
            }
            ${userRow}:nth-child(even) {
                background: #fafafa;
            }
            ${userRow}:hover{
                background-color: #f8f8d3ff;
            }
            ${deleteButton} {
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 6px 10px;
                cursor: pointer;
                transition: background 0.2s;
            }
            ${deleteButton}:hover {
                background: #c0392b;
            }
            ${apiButton}{
                background: green;
                color: white;
                padding: 5px;
                border-radius: 5px;
            }
            @media (max-width: 700px) {
                ${insApiUsers} {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                ${headerRow} {
                    display: none; 
                }
                ${userRow} {
                    display: flex;
                    flex-direction: column;
                    background: #fff;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    padding: 10px;
                    width: 100%;            
                    max-width: 300px;       
                }
                ${cell} {
                    display: flex;
                    padding: 6px 0;
                }
                ${cell}::before {
                    content: attr(data-label);
                    flex: 0 0 100px;
                    font-weight: bold;
                    color: #555;
                    align-self: center;
                }   
            }`;

        const style = document.createElement('style');
        
        style.textContent = customCss;

        document.head.appendChild(style);
    };

    const getDataFromLocalStorage = (storageName) => {
        return JSON.parse(localStorage.getItem(storageName)); 
    };

    const setDataToLocalStorage = (storageName, data, receivedAt = new Date()) => {
        const dataObject = {
            results: data,
            receivedAt:receivedAt,
        };

        localStorage.setItem(storageName, JSON.stringify(dataObject)); 
    };

    const clearLocalStorage = (storageName) => {
        localStorage.removeItem(storageName);
    };

    const isDataOutdated = (receivedAtTime, aliveTime) => {
        const timeBetween = new Date() - new Date(receivedAtTime);

        console.log('received at time from local storage: ', new Date(receivedAtTime));

        if (timeBetween > aliveTime) {
            console.log('outdated data, clearing data from local storage');

            clearLocalStorage(userStorageName);

            return true;
        } else {
            console.log('users data is still alive');

            return false;
        }
    };
    
    const renderUsers = (users) => {
        const { userRow, cell, deleteButton, headerRow, headerCell } = classes;
        let usersHtml = '';

        users.forEach((user) => {
            usersHtml +=
                `<div class="${userRow}">
                    <div class="${cell}" data-label="Name"><p>${user.name}</p></div>
                    <div class="${cell}" data-label="E-mail"><p>${user.email}</p></div>
                    <div class="${cell}" data-label="Address"><p>${user.address.city}</p></div>
                    <div class="${cell}" data-label="Actions">
                        <button class="${deleteButton}" data-id="${user.id}">delete</button>
                    </div>
                </div>`;
        });

        let html = '';

        html =
            `<div class="user-list-container">
                <div class="${headerRow}">
                    <div class="${headerCell}">Name</div>
                    <div class="${headerCell}">E-mail</div>
                    <div class="${headerCell}">Address</div>
                    <div class="${headerCell}">Actions</div>
                </div>
                ${usersHtml}
            </div>`;

        appendLocationDiv.innerHTML = html;
        
        appendLocationDiv
            .querySelector(selectors.userListContainer)
            .addEventListener('click', deleteUserHandler);

        observeUserList();
    };

    const deleteUserHandler = (e) => {
        const target = e.target;

        if (target.classList.contains("delete-button")) {
            e.stopPropagation();

            const userId = target.getAttribute('data-id');

            target.closest(selectors.userRow).remove();
            
            const parsedData = getDataFromLocalStorage(userStorageName);
            const updatedData = parsedData.results.filter(user => user.id !== parseInt(userId));

            if (updatedData.length > 0) {
                setDataToLocalStorage(userStorageName,updatedData,parsedData.receivedAt);
            } else {
                appendLocationDiv.querySelector(selectors.userListContainer).innerHTML = '';
            
                clearLocalStorage(userStorageName);
            }
        }
    };
    
    const getDataFromApiAndRender = (url) => {
        getUsersData(url)
            .then(response => {
                setDataToLocalStorage(userStorageName, response);

                renderUsers(response);
            })
            .catch(error => {
                console.error('something went wrong: ', error);

                showError(selectors.idInsApiUsers, error)
            });
    }; 

    const observeUserList = () => {
        const userListContainer = appendLocationDiv.querySelector(selectors.userListContainer);

        if (!userListContainer) {
            return;
        }

        const observer = new MutationObserver(() => {
            const hasUsers = userListContainer.querySelectorAll(selectors.userRow).length > 0;
            const apiButton = appendLocationDiv.querySelector(selectors.apiButton);

            if (!hasUsers) {
                if (!apiButton) {
                    const apiButton = document.createElement('button');

                    apiButton.classList.add(classes.apiButton);
                    apiButton.textContent = 'Api Button';

                    apiButton.addEventListener('click', () => {
                        const data = sessionStorage.getItem('isClicked');
                        if (data === 'true') {
                            console.log('api button can be used once in a session');

                            window.alert('api button can be used once in a session');
                            
                            return;
                        }

                        getDataFromApiAndRender(usersUrl);
                    
                        apiButton.remove();

                        sessionStorage.setItem('isClicked', 'true'); 
                    });

                    appendLocationDiv.appendChild(apiButton);

                    observer.disconnect();

                    console.log('observer disconnected')
                }
            } else if (apiButton) {
                apiButton.remove();
            }
        });

        observer.observe(userListContainer, { childList: true, subtree: true });
    };

    const init = () => {
        createCustomStyle();

        const parsedData = getDataFromLocalStorage(userStorageName);

        if (!parsedData || isDataOutdated(parsedData.receivedAt, aliveTime)) {
            console.log('fetching data from api');

            getDataFromApiAndRender(usersUrl);

        } else {
            console.log('data from local storage');

            renderUsers(parsedData.results);
        }
    };
        
    init();
})();
