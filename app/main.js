import deepFreeze from 'deep-freeze';
import expect from 'expect';
import { createStore, combineReducers } from 'redux';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';

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

const mapStateToLinkProps = (
  state,
  ownProps
) => {
  return {
    active: ownProps.filter === state.visibilityFilter
  };
};

const mapDispatchToLinkProps = (
  dispatch,
  ownProps
) => {
  return {
    onClick: () => {
      dispatch({
        type: 'SET_VISIBILITY_FILTER',
        filter: ownProps.filter
      })
    }
  };
};

const FilterLink = connect(
  mapStateToLinkProps,
  mapDispatchToLinkProps
)(Link);

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

let nextTodoId = 0;
/*
  Not presentation nor container, doesn't fit either
   - input adn button are presentational
   - dispatching action is container

  Keeping together because they don't need to be seperated
*/


const addTodo = (text) => {
  return {
    type: 'ADD_TODO',
    id: nextTodoId++,
    text: text
  };
}
let AddTodo = ({ dispatch }) => {
  let input;

  return(
    <div>
      <input ref={node => {
          input = node
      }} />
      <button onClick={() => {
        dispatch(addTodo(input.value));
        input.value = '';
      }}>
        Add Todo
      </button>
    </div>
  );
}
AddTodo = connect(
  /*
  This is what it looks like with default param

    state => {
      return {};
    },
    dispatch => {
      return { dispatch };
    }

  Which could just be this
    null, // don't need to actually subscribe to store
    null // <-- get dispatch for free

  Therefore, if both null we can just leave empty
  */
)(AddTodo);

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

// Maps the redux store state to the
// Props of the TodoList component
const mapStateToTodoListProps = (state) => {
  return {
    todos: getVisibleTodos(state.todos, state.visibilityFilter)
  };
};

// Maps the dispatch method of the store
// to the callback props of the TodoList component
const mapDispatchToTodoListProps = (dispatch) => {
  return {
    onTodoClick: (id) => {
      dispatch({
        type: 'TOGGLE_TODO',
        id
      })
    }
  }
}

const VisibleTodoList = connect(
  mapStateToTodoListProps,
  mapDispatchToTodoListProps
)(TodoList)

const TodoApp = () => (
  <div>
    <AddTodo />
    <VisibleTodoList />
    <Footer />
  </div>
);

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
