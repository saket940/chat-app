import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './login'
import All from './index'
import Layout from './Layout'
import Register from './register'
import ErrorBoundary from './ErrorBoundary'
const Viue = () => {
    const router = createBrowserRouter([{         
        path: "/",
        element: <Layout />, // Use Layout as the wrapper
        errorElement: <ErrorBoundary />,
        children: [
        {
            path:"/login",
            element:<Login/>
        },
        {
            path:"/",
            element:<All/>
        },
        {
            path:"/register",
            element:<Register/>
        }
      ],
},
    ])
  return (
<><RouterProvider router={router}/></>
  )
}
export default Viue;