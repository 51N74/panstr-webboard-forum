'use client'
import { useState } from 'react';



export default function Header() {
    const [isLogin, setIsLogin] = useState(false);
    

    const showLogin = () => {
        setIsLogin(!isLogin);
      };


      let greetingMessage;
      if (isLogin) {
        greetingMessage = 'Welcome back!';
      } else {
        greetingMessage = 'Please log in.';
      }
    
  return (
    <>
    
    

    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl" href="/">
          Panstr
        </a>
      </div>
      <div className="flex-none gap-2">
        <div className="form-control">
          <input
            type="text"
            placeholder="Search"
            className="input input-bordered w-24 md:w-auto"
          />
        </div>

        <div>
        
    </div>
        
    <div>

   

      {/* <button onClick={showLogin}>
      {!isLogin ? <a href="/api/auth/login">Login</a> : 'Logout'}
        
      </button> */}
      
    </div>

    <div>
      <h1>{greetingMessage}</h1>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Log out' : 'Log in'}
      </button>
    </div>


        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <img
                alt="Tailwind CSS Navbar component"
                src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg"
              />
            </div>
          </div>
          <ul
            tabIndex={0}
            className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
          >
            <li>
              <a className="justify-between" href="/profile">
                Profile
                <span className="badge">New</span>
              </a>
            </li>
            <li>
              <a>Settings</a>
            </li>
            <li>
              <a href="/api/auth/logout">Logout</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
    </>
  );
}
