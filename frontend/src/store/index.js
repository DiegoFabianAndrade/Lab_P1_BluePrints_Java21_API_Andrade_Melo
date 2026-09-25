import { configureStore } from '@reduxjs/toolkit'
import blueprintsReducer from '../features/blueprints/blueprintsSlice.js'
import authReducer from '../features/auth/authSlice.js'

/** Fabrica del store; las pruebas la reutilizan con estado precargado. */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: {
      blueprints: blueprintsReducer,
      auth: authReducer,
    },
    preloadedState,
  })
}

const store = makeStore()

export default store
