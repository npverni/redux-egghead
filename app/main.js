import deepFreeze from 'deep-freeze';
import expect from 'expect';
import { createStore, combineReducers } from 'redux';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

const todo = (state, action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        id: action.id,
        text: action.text,
        completed:false
      };
    case 'TOGGLE_TODO': {
      if (state.id !== action.id) {
        return state;
      };

      return {
        ...state,
        completed: !state.completed
      }
    }
    default:
      return state
  }
};

const todos = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [
        ...state,
        todo(undefined, action)
      ];
    case 'TOGGLE_TODO':
      return state.map(t => todo(t, action));
    default:
      return state;
  }
};

const visibilityFilter = (
  state = 'SHOW_ALL',
  action
) => {
  switch (action.type) {
    case 'SET_VISIBILITY_FILTER':
      return action.filter
    default:
      return state;
  }
};

const todoApp = combineReducers({
  todos,//: todos,
  visibilityFilter,//: visibilityFilter <-- don't need to specify if same name (thanks to es6 object literal shorthand notation)
});

/* Presentation Component */
class FilterLink extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() =>
      this.forceUpdate()
    );
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render () {
    const props = this.props;
    const { store } = this.context;
    const state = store.getState();

    return (
      <Link
        active={state.visibilityFilter === props.filter}
        onClick={() =>
          store.dispatch({
            type: 'SET_VISIBILITY_FILTER',
            filter: props.filter
          })
        }
      >
        {props.children}
      </Link>
    );
  }
}
FilterLink.contextTypes = {
  store: React.PropTypes.object
}

/* Presentation Component */
const Link = ({
  active,
  children,
  onClick
}) => {
  if (active) { return <span>{children}</span>}
  return (
    <a href='#'
      onClick={e => {
        e.preventDefault();
        onClick();
      }}
    >
    {children}
    </a>
  );
}

/* Presentation Component */
const Footer = () => (
  <p>
    Show:
    {' '}
    <FilterLink filter='SHOW_ALL'>All</FilterLink>
    {' '}
    <FilterLink filter='SHOW_ACTIVE'>Active</FilterLink>
    {' '}
    <FilterLink filter='SHOW_COMPLETED'>Completed</FilterLink>
  </p>
);

const Todo = ({
  onClick,
  completed,
  text
}) => (
  <li
    onClick={onClick}
    style={{ textDecoration: completed ? 'line-through' : 'none' }}
  >
    {text}
  </li>
);

/* Presentation Component */
const TodoList = ({
  todos,
  onTodoClick
}) => (
  <ul>
    {todos.map(todo =>
      <Todo
        key={todo.id}
        {...todo}
        onClick={() => onTodoClick(todo.id)}
      />
    )}
  </ul>
);

/*
  Not presentation nor container, doesn't fit either
   - input adn button are presentational
   - dispatching action is container

  Keeping together because they don't need to be seperated
*/
const AddTodo = (props, { store }) => {
  let input;

  return(
    <div>
      <input ref={node => {
          input = node
      }} />
      <button onClick={() => {
        store.dispatch({
          type: 'ADD_TODO',
          id: nextTodoId++,
          text: input.value
        })
        input.value = '';
      }}>
        Add Todo
      </button>
    </div>
  );
}
AddTodo.contextTypes = {
  store: React.PropTypes.object
}

const getVisibleTodos = (
  todos,
  filter
) => {
  switch (filter) {
    case 'SHOW_ALL':
      return todos;
    case 'SHOW_COMPLETED':
      return todos.filter(t => t.completed);
    case 'SHOW_ACTIVE':
      return todos.filter(t => !t.completed);
    default:
      return todos;
  }
}

/* Container component */
class VisibleTodoList extends Component {
  componentDidMount() {
    const { store } = this.context;
    this.unsubscribe = store.subscribe(() =>
      this.forceUpdate()
    );
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render () {
    const { store } = this.context;
    const state = store.getState();
    return (
      <TodoList
        todos = {getVisibleTodos(state.todos, state.visibilityFilter)}
        onTodoClick={id =>
          store.dispatch({
            type: 'TOGGLE_TODO',
            id
          })
        }
      />
    );
  }
}
VisibleTodoList.contextTypes = {
  store: React.PropTypes.object
};

let nextTodoId = 0;

const TodoApp = () => (
  <div>
    <AddTodo />
    <VisibleTodoList />
    <Footer />
  </div>
);

class Provider extends Component {
  getChildContext() {
    return {
      store: this.props.store
    };
  }
  render () {
    return this.props.children;
  }
}
Provider.childContextTypes = {
  store: React.PropTypes.object
};

// if you don't want redux dev tools, just use this:
// const store = createStore(todoApp);
const finalStore = createStore(
  todoApp,
  {}, // initial state
  window.devToolsExtension ? window.devToolsExtension() : undefined
);

ReactDOM.render(
  <Provider store={finalStore} >
    <TodoApp />
  </Provider>,
  document.getElementById('root')
);
