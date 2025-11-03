"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useNostrAuth } from "../../../../context/NostrAuthContext";
import CommentsForm from "../../../components/Comments_Form";
import NostrWidget from "../../../components/NostrWidget";
import { TrashIcon } from "@heroicons/react/solid";
import { useRouter } from "next/router";
const Blog = ({ params }) => {
  const { id } = params;
  const [posts, setPosts] = useState([]);
  const { user, error, isLoading } = useNostrAuth();
  const [comments, setComments] = useState([]);
  const fetchPosts = async (id) => {
    try {
      const response = await axios.get(`/api/posts/${id}`);
      const data = response.data;
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([data]); // ถ้าไม่ใช่อาร์เรย์ ให้นำมาใส่ในอาร์เรย์
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      // Fetch comments using the postId in the API call
      const response = await axios.get(`/api/comments?postId=${postId}`);
      const commentData = response.data;

      // Ensure commentData is an array before setting the comments state
      setComments(Array.isArray(commentData) ? commentData : [commentData]);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPosts(id);
      fetchComments(id);
    }
  }, [id]);

  const handleEdit = async (postId, newTitle, newContent) => {
    try {
      await axios.put(`/api/posts/${postId}`, {
        title: newTitle,
        content: newContent,
      });
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? { ...post, title: newTitle, content: newContent }
            : post,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error(error);
    }
  };

  //Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/api/comments/${commentId}`);
      setComments(comments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error(error);
    }
  };

  const [content, setContent] = useState("");

  const handleCommentPost = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`/api/comments/`, {
        postId: id,
        content,
        commentName: user.name,
        commentImage: user.picture,
      });
      const router = useRouter();
      router.push(router.asPath); // Reload the page
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
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/contents/forums/news">Forums</a>
          </li>
        </ul>
      </div>

      {posts.map((post) => (
        <div key={post.id} className="px-8 mb-8">
          <div className="text-xl bg-slate-300 p-2">
            <div className="flex justify-between items-center">
              <h3> หัวข้อ: {post.title}</h3>
              {user && user.name === post.authorName && (
                <div className="flex space-x-4">
                  <Link href={`/contents/blog/${post.id}/edit`}>
                    <button className="bg-blue-500 text-white px-3 py-1 rounded flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-6"
                      >
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                      </svg>
                    </button>
                  </Link>

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row ">
            {/*Menu Forums*/}
            <div className="basis-1/5 p-2">
              <p className="text-xl ">{post.authorName}</p>
              <img src={post.authorImage} alt={`${post.authorName}'s avatar`} />
              <div className="bg-slate-100"></div>
            </div>

            <div className="basis-4/5 p-2 ">
              <p className="font-medium border-b-2">{post.title}</p>

              <div>
                <p>{post.content}</p>
              </div>
            </div>
          </div>

          {/* Fectch Comments */}
          {comments.map((comment) => (
            <div key={comment.id}>
              <div className="text-xl bg-slate-100 p-2">
                <div className="flex justify-between items-center">
                  <h3>#{comment.id} </h3>
                  {user && user.name === comment.commentName && (
                    <div className="flex space-x-4">
                      <Link href={`/contents/comments/${comment.id}/edit`}>
                        <button className="bg-blue-500 text-white px-3 py-1 rounded flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-6"
                          >
                            <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                            <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                          </svg>
                        </button>
                      </Link>

                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-row ">
                  <div className="basis-1/5 p-2">
                    <p className="text-xl">{comment.commentName}</p>
                    <img
                      src={comment.commentImage}
                      alt={`${comment.commentImage}'s avatar`}
                    />
                    <div className="bg-slate-100">{comment.createdAt}</div>
                  </div>
                  <div className="basis-4/5 px-5">
                    <div>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* check user*/}
          {!user && (
            <div className="flex flex-col items-center justify-center my-10">
              <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center text-gray-900">
                  Please Login to Comment
                </h2>
                <div className="flex justify-center ">
                  <Link href="/api/auth/login">
                    <button className="btn btn-outline btn-accent ">
                      Login
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
          {user && <CommentsForm {...{ postId: post.id }} />}

          {/* Nostr widget for this thread */}
          <div className="mt-6">
            <NostrWidget
              thread={{
                id: post.id,
                title: post.title,
                url: `/contents/blog/${post.id}`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Blog;
