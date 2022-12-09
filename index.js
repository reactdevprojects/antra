const APIs = (() => {
    const URL = "http://localhost:3000/todos";

    const addTodo = (newTodo) => {
        // post
        return fetch(URL, {
            method: "POST",
            body: JSON.stringify(newTodo),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const removeTodo = (id) => {
        return fetch(URL + `/${id}`, {
            method: "DELETE",
        }).then((res) => res.json());
    };
    const updateTodo = (id,data) => {
        return fetch(URL + `/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" },
        }).then((res) => res.json());
    };

    const getTodos = () => {
        return fetch(URL).then((res) => res.json());
    };
    return {
        addTodo,
        removeTodo,
        getTodos,
        updateTodo,
    };
})();

const Model = (() => {
    //todolist
    class State {
        #todos; //[{id: ,title: },{}]
        #onChange;
        #editingId;
        constructor() {
            this.#todos = [];
        }

        get todos() {
            return this.#todos;
        }

        set todos(newTodo) {
            console.log("setter");
            this.#todos = newTodo;
            //const obj = {name:"adam"}; 
            //obj.age //undefined 
            //obj.age(); //error
            this.#onChange?.();
        }

        get editingId() {
            return this.#editingId;
        }

        set editingId(id) {
           this.#editingId = id
            this.#onChange?.();
        }

        subscribe(callback) {
            this.#onChange = callback;
        }
    }
    let { getTodos, removeTodo, addTodo, updateTodo } = APIs;

    return {
        State,
        getTodos,
        removeTodo,
        addTodo,
        updateTodo,
    };
})();
//BEM, block element modifier methodology
const View = (() => {
    const formEl = document.querySelector(".form"); //querying
    const todoListEl = document.querySelector(".todo-list");
    const updateTodoList = (todos, editingId) => {
        let template = "";
        const sortedTodos = todos.sort((a, b)=> a.completed - b.completed )
        const firstDisabledIndex = sortedTodos.findIndex(t => t.completed)
        console.log("firstDisabledIndex",firstDisabledIndex)
        sortedTodos.forEach((todo, index) => {
            const isEditing = +editingId === todo.id
            const wrapperStyle = index === firstDisabledIndex? 'display:flex; margin-top: 20px;': ''
            const item = isEditing? `<input name="${todo.id}" value="${todo.title}"/>`:`<span >${todo.title} - completed:${!!todo.completed}</span>`
            const editBtn = !todo.completed ?`<button  class="btn--update" id="${todo.id}">${isEditing?"save":"update"}</button>`:''
            const todoTemplate = `<li style="${wrapperStyle}" class="todo-wrapper" id="${todo.id}">${item} ${editBtn} <button class="btn--delete" id="${todo.id}">remove</button></li>`;
            template += todoTemplate;
        });
        if(todos.length === 0){
            template = "no task to display"
        }
        todoListEl.innerHTML = template;
    };

    return {
        formEl,
        todoListEl,
        updateTodoList,
    };
})();


const ViewModel = ((View, Model) => {
    console.log("model", Model);
    const state = new Model.State();

    const getTodos = () => {
        Model.getTodos().then((res) => {
            state.todos = res;
        });
    };

    const addTodo = () => {
        View.formEl.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const title = event.target[0].value;
            if(title.trim() === "") {
                alert("please input title!");
                return;
            }
            console.log("title", title);
            const newTodo = { title };
            Model.addTodo(newTodo)
                .then((res) => {
                    state.todos = [res, ...state.todos];
                    event.target[0].value = ""
                })
                .catch((err) => {
                    alert(`add new task failed: ${err}`);
                });
        });
    };

    const removeTodo = () => {
        //event bubbling: event listener from parent element can receive event emitted from its child
        View.todoListEl.addEventListener("click",(event)=>{
            //console.log(event.target/* emit the event */, event.currentTarget/* receive the event */);
            const id = event.target.id;
            //console.log("id", id)
            if(event.target.className === "btn--delete"){
                Model.removeTodo(id).then(res=>{
                    state.todos = state.todos.filter(todo=> +todo.id !== +id)
                }).catch(err=>alert(`delete todo failed: ${err}`))
            }
        })
    };
     const onWrapperClick = () => {
        //event bubbling: event listener from parent element can receive event emitted from its child
        View.todoListEl.addEventListener("click",(event)=>{
            const id = event.target.id;
            if(event.target.className === "todo-wrapper"){
                const todo = state.todos.find(t=> t.id === +id)
                 Model.updateTodo(id, {completed: !(todo.completed ?? false)}).then(res=>{
                       state.todos = state.todos.map(t => (t.id === res.id)? res: t)
                    }).catch(err=>alert(`update failed: ${err}`))
            }
        })
    };
    const updateTodo = () => {
        // event bubbling: event listener from parent element can receive event emitted from its child
        View.todoListEl.addEventListener("click",(event)=>{
            const id = event.target.id;
            if(event.target.className === "btn--update"){
                if(state.editingId === +id){
                  // save changes
                    const title = View.todoListEl.querySelector(`input[name="${id}"]`).value
                    Model.updateTodo(id, {title}).then(res=>{
                        // disable editing
                       state.editingId = null
                       state.todos = state.todos.map(t => (t.id === res.id)? res: t)
                    }).catch(err=>alert(`update failed: ${err}`))

                }else{
                    // start editing 
                    state.editingId = +id
                }
     
            }
        })
    };

    const bootstrap = () => {
        addTodo();
        getTodos();
        removeTodo();
        onWrapperClick();
        updateTodo();
        state.subscribe(() => {
            View.updateTodoList(state.todos, state.editingId);
        });
    };

    return {
        bootstrap,
    };
})(View, Model);

ViewModel.bootstrap();