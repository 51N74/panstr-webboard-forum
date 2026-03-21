"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
} from "react";
import { uploadFileNip96 } from "../lib/nostrClient";

const Icons = {
    H1: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8" /><path d="M4 18V6" /><path d="M12 18V6" /><path d="m17 12 3-2v8" />
        </svg>
    ),
    H2: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8" /><path d="M4 18V6" /><path d="M12 18V6" /><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
        </svg>
    ),
    H3: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8" /><path d="M4 18V6" /><path d="M12 18V6" /><path d="M17.5 18a2.5 2.5 0 0 0 0-5 2.5 2.5 0 0 0 0-5H17" />
        </svg>
    ),
    Bold: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 12a4 4 0 0 0 0-8H6v8" /><path d="M15 20a4 4 0 0 0 0-8H6v8Z" />
        </svg>
    ),
    Italic: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
        </svg>
    ),
    Underline: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v6a6 6 0 0 0 12 0V4" /><line x1="4" y1="20" x2="20" y2="20" />
        </svg>
    ),
    List: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    ),
    ListOrdered: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
    ),
    AlignLeft: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" />
        </svg>
    ),
    AlignCenter: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" />
        </svg>
    ),
    AlignJustify: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    ),
    Quote: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        </svg>
    ),
    Code: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    CodeBlock: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 16v-8" /><path d="M15 8v8" /><path d="M9 12h6" />
        </svg>
    ),
    Link: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Image: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
};

/**
 * Lightweight contentEditable Rich Text Editor
 * - Supports basic toolbar actions (headings, bold/italic/underline, lists, align, quote, code, link)
 * - Drag & drop and file picker for images
 * - Inserts a base64 preview immediately and uses NIP-96 Standard Upload
 *
 * Props:
 *  - value (HTML string)
 *  - onChange (html) => void
 *  - disabled (bool)
 *  - onUpload (file, uploadId, url) => void
 *  - onUploadError (error, uploadId) => void
 */
const RichTextEditor = forwardRef(function RichTextEditor(
    { value, onChange, disabled, onUpload, onUploadError },
    ref,
) {
    const editorDiv = useRef(null);
    const fileInput = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    // Keep editor content in sync with controlled value
    useEffect(() => {
        if (editorDiv.current && value !== editorDiv.current.innerHTML) {
            editorDiv.current.innerHTML = value || "";
        }
    }, [value]);

    // Expose a replaceImageSrc method so parent can swap preview -> uploaded URL
    useImperativeHandle(ref, () => ({
        replaceImageSrc(uploadId, newUrl) {
            if (!editorDiv.current) return;
            const img = editorDiv.current.querySelector(
                `img[data-upload-id="${uploadId}"]`,
            );
            if (img) {
                img.src = newUrl;
                // remove the attribute as upload is complete
                img.removeAttribute("data-upload-id");
            }
        },
    }));

    const triggerChange = () => {
        if (!editorDiv.current) return;
        onChange && onChange(editorDiv.current.innerHTML);
    };

    const exec = (command, value = null) => {
        if (disabled) return;
        document.execCommand(command, false, value);
        triggerChange();
    };

    const setHeading = (level) => {
        if (disabled) return;
        document.execCommand("formatBlock", false, `h${level}`);
        triggerChange();
    };

    const insertLink = () => {
        if (disabled) return;
        const url = prompt("Enter a URL:", "https://");
        if (url) {
            document.execCommand("createLink", false, url);
            triggerChange();
        }
    };

    const insertInlineCode = () => {
        if (disabled) return;
        const sel = window.getSelection().toString() || "code";
        document.execCommand("insertHTML", false, `<code>${sel}</code>`);
        triggerChange();
    };

    const insertCodeBlock = () => {
        if (disabled) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const pre = document.createElement("pre");
        pre.textContent = range.toString();
        range.deleteContents();
        range.insertNode(pre);
        triggerChange();
    };

    const insertImageAtCursor = (src, uploadId = null, caption = "") => {
        if (!editorDiv.current) return;
        const img = document.createElement("img");
        img.src = src;
        img.alt = caption || "image";
        img.className = "max-w-full rounded-xl shadow-md my-4";
        if (uploadId) img.setAttribute("data-upload-id", uploadId);

        const figure = document.createElement("figure");
        figure.className = "my-6";
        figure.appendChild(img);

        if (caption !== false) {
            const figcap = document.createElement("figcaption");
            figcap.contentEditable = "true";
            figcap.className = "text-sm text-gray-500 mt-2 text-center italic";
            figcap.innerText = caption || "";
            figure.appendChild(figcap);
        }

        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
            editorDiv.current.appendChild(figure);
        } else {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(figure);
            // Move caret after the figure
            range.setStartAfter(figure);
            range.setEndAfter(figure);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        triggerChange();
    };

    const handleFiles = async (files) => {
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        for (const file of imageFiles) {
            // create a unique upload id
            const uploadId = Math.random().toString(36).slice(2);
            
            // 1. Insert local preview immediately
            const reader = new FileReader();
            reader.onload = async (e) => {
                insertImageAtCursor(e.target.result, uploadId);
                
                try {
                    // 2. Use NIP-96 Standard Upload
                    const result = await uploadFileNip96(file);
                    
                    if (result && result.url) {
                        // 3. Replace preview with final URL
                        if (editorDiv.current) {
                            const img = editorDiv.current.querySelector(
                                `img[data-upload-id="${uploadId}"]`,
                            );
                            if (img) {
                                img.src = result.url;
                                img.removeAttribute("data-upload-id");
                            }
                        }
                        // 4. Notify parent
                        onUpload && onUpload(file, uploadId, result.url);
                    }
                } catch (error) {
                    console.error("Standardized upload failed:", error);
                    // Remove preview on error
                    if (editorDiv.current) {
                        const figure = editorDiv.current.querySelector(
                            `figure:has(img[data-upload-id="${uploadId}"])`
                        );
                        if (figure) figure.remove();
                    }
                    // Notify parent
                    if (onUploadError) {
                        onUploadError(error, uploadId);
                    } else {
                        alert("Failed to upload image: " + error.message);
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const onDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer?.files || []);
        await handleFiles(files);
    };

    const onPaste = (e) => {
        // allow paste then sync content
        setTimeout(triggerChange, 0);
    };

    const handleFileInput = async (e) => {
        const files = Array.from(e.target.files || []);
        await handleFiles(files);
        e.target.value = null;
    };

    const ToolbarButton = ({ onClick, label, icon, active }) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${active
                    ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-200"
                    : "text-gray-500 hover:text-gray-900"
                }`}
            title={label}
        >
            {icon || label}
        </button>
    );

    const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1" />;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 relative">
            <div className="bg-gray-50/50 border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center">
                <ToolbarButton onClick={() => setHeading(1)} label="Heading 1" icon={<Icons.H1 />} />
                <ToolbarButton onClick={() => setHeading(2)} label="Heading 2" icon={<Icons.H2 />} />
                <ToolbarButton onClick={() => setHeading(3)} label="Heading 3" icon={<Icons.H3 />} />
                <Divider />
                <ToolbarButton onClick={() => exec("bold")} label="Bold" icon={<Icons.Bold />} />
                <ToolbarButton onClick={() => exec("italic")} label="Italic" icon={<Icons.Italic />} />
                <ToolbarButton onClick={() => exec("underline")} label="Underline" icon={<Icons.Underline />} />
                <Divider />
                <ToolbarButton onClick={() => exec("insertUnorderedList")} label="Bullet List" icon={<Icons.List />} />
                <ToolbarButton onClick={() => exec("insertOrderedList")} label="Numbered List" icon={<Icons.ListOrdered />} />
                <Divider />
                <ToolbarButton onClick={() => exec("justifyLeft")} label="Align Left" icon={<Icons.AlignLeft />} />
                <ToolbarButton onClick={() => exec("justifyCenter")} label="Align Center" icon={<Icons.AlignCenter />} />
                <ToolbarButton onClick={() => exec("justifyFull")} label="Justify" icon={<Icons.AlignJustify />} />
                <Divider />
                <ToolbarButton onClick={() => exec("formatBlock", "blockquote")} label="Quote" icon={<Icons.Quote />} />
                <ToolbarButton onClick={insertInlineCode} label="Inline Code" icon={<Icons.Code />} />
                <ToolbarButton onClick={insertCodeBlock} label="Code Block" icon={<Icons.CodeBlock />} />
                <ToolbarButton onClick={insertLink} label="Link" icon={<Icons.Link />} />

                <div className="ml-auto">
                    <input
                        ref={fileInput}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileInput}
                        className="hidden"
                        id="rte-file-input"
                    />
                    <label
                        htmlFor="rte-file-input"
                        className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-sm active:scale-95"
                    >
                        <span className="mr-2"><Icons.Image /></span> Add Image
                    </label>
                </div>
            </div>

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`min-h-[300px] p-6 bg-white transition-colors duration-200 ${dragOver ? "bg-blue-50/30" : ""
                    }`}
            >
                <div
                    ref={editorDiv}
                    className="prose prose-lg max-w-none focus:outline-none"
                    contentEditable={!disabled}
                    onInput={triggerChange}
                    onPaste={onPaste}
                    suppressContentEditableWarning={true}
                    style={{ minHeight: 280 }}
                    placeholder="Write your masterpiece here..."
                />
            </div>

            {dragOver && (
                <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center pointer-events-none border-2 border-blue-500 border-dashed rounded-xl m-1">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg text-blue-600 font-medium">
                        Drop images here
                    </div>
                </div>
            )}
        </div>
    );
});

export default RichTextEditor;
