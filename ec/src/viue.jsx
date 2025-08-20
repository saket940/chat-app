import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './login'
import All from './index'
import Layout from './Layout'
import Register from './register'
import Chat from './Chat'
import ErrorBoundary from './e'
const Viue = () => {
    const router = createBrowserRouter([{         
        path: "/",
        element: <Layout />, // Use Layout as the wrapper
        children: [
        {
            path:"/login",
            element:<Login/>
        },
        {
            path:"/",
            element:<All/>,
            errorElement:<ErrorBoundary/>
        },
        {
            path:"/register",
            element:<Register/>
        },
        {
            path:"/chat/:userId",
            element:<Chat/>
        }
      ],
},
    ])
  return (
<><RouterProvider router={router}/></>
  )
}
export default Viue;
