import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './login'
import All from './index'
import Layout from './Layout'
import Register from './register'
import Chat from './Chat'   // 👈 import Chat

const Viue = () => {
  const router = createBrowserRouter([
    {         
      path: "/",
      element: <Layout />,
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
        },
        {
          path:"/chat/:userId",   // 👈 new route
          element:<Chat/>
        }
      ],
    }
  ])
  
  return <RouterProvider router={router}/>
}

export default Viue

