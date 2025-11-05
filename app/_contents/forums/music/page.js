"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

const List = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/api/posts/category/music");
      setPosts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {/*Breadcrumb*/}
      <div className="text-sm breadcrumbs mx-4 mb-4">
        <ul>
          <li>
            <a>Home</a>
          </li>
          <li>
            <a>Forums</a>
          </li>
        </ul>
      </div>
      <div className="px-8 mb-8">
        <h3 className="text-xl bg-slate-300 p-2">Music</h3>

        <div className="overflow-x-auto">
          <table className="table ">
            {/* head */}
            <thead className="bg-slate-400">
              <tr className="text-white">
                <th>Topics</th>
                <th>Last Post By</th>
              </tr>
            </thead>

            <tbody className="bg-slate-100">
              {posts.map((post) => (
                <tr key={post.id}>
                  <Link href={`/contents/blog/${post.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.title}
                      </div>
                    </td>{" "}
                  </Link>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {post.authorName}

                    {/* <Link
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    href={`/edit/${post.id}`}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default List;
