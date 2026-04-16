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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12h8" /><path d="M4 18V6" /><path d="M12 18V6" /><path d="m17 12 3-2v8" />
        </svg>
    ),
    Bold: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 12a4 4 0 0 0 0-8H6v8" /><path d="M15 20a4 4 0 0 0 0-8H6v8Z" />
        </svg>
    ),
    Italic: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
        </svg>
    ),
    List: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    ),
    Quote: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        </svg>
    ),
    Code: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    Link: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Image: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
};

/**
 * RichTextEditor - Panstr Minimal
 * Streamlined editor for mobile and desktop
 */
const RichTextEditor = forwardRef(function RichTextEditor(
    { value, onChange, disabled, onUpload, onUploadError },
    ref,
) {
    const editorDiv = useRef(null);
    const fileInput = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        if (editorDiv.current && value !== editorDiv.current.innerHTML) {
            editorDiv.current.innerHTML = value || "";
        }
    }, [value]);

    useImperativeHandle(ref, () => ({
        replaceImageSrc(uploadId, newUrl) {
            if (!editorDiv.current) return;
            const img = editorDiv.current.querySelector(`img[data-upload-id="${uploadId}"]`);
            if (img) {
                img.src = newUrl;
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

    const handleFiles = async (files) => {
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));
        for (const file of imageFiles) {
            const uploadId = Math.random().toString(36).slice(2);
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = document.createElement("img");
                img.src = e.target.result;
                img.className = "max-w-full rounded-md border border-surface-border my-4 block mx-auto";
                img.setAttribute("data-upload-id", uploadId);
                
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.insertNode(img);
                    range.setStartAfter(img);
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else {
                    editorDiv.current.appendChild(img);
                }
                
                try {
                    const result = await uploadFileNip96(file);
                    if (result?.url && editorDiv.current) {
                        const target = editorDiv.current.querySelector(`img[data-upload-id="${uploadId}"]`);
                        if (target) { target.src = result.url; target.removeAttribute("data-upload-id"); }
                        onUpload?.(file, uploadId, result.url);
                    }
                } catch (error) {
                    editorDiv.current.querySelector(`img[data-upload-id="${uploadId}"]`)?.remove();
                    onUploadError ? onUploadError(error, uploadId) : alert("Upload failed: " + error.message);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const ToolbarButton = ({ onClick, label, icon }) => (
        <button
            type="button"
            onClick={onClick}
            className="p-2 rounded hover:bg-surface-muted text-secondary hover:text-primary transition-colors flex-shrink-0"
            title={label}
        >
            {icon}
        </button>
    );

    return (
        <div className="border border-surface-border rounded-md overflow-hidden bg-white focus-within:border-accent/50 transition-colors relative">
            <div className="bg-surface-muted/50 border-b border-surface-border p-1 flex flex-wrap items-center gap-0.5 overflow-x-auto custom-scrollbar">
                <ToolbarButton onClick={() => exec("formatBlock", "h2")} label="Heading" icon={<Icons.H1 />} />
                <div className="w-px h-4 bg-surface-border mx-1" />
                <ToolbarButton onClick={() => exec("bold")} label="Bold" icon={<Icons.Bold />} />
                <ToolbarButton onClick={() => exec("italic")} label="Italic" icon={<Icons.Italic />} />
                <div className="w-px h-4 bg-surface-border mx-1" />
                <ToolbarButton onClick={() => exec("insertUnorderedList")} label="List" icon={<Icons.List />} />
                <ToolbarButton onClick={() => exec("formatBlock", "blockquote")} label="Quote" icon={<Icons.Quote />} />
                <ToolbarButton onClick={() => exec("insertHTML", false, `<code>${window.getSelection().toString() || "code"}</code>`)} label="Code" icon={<Icons.Code />} />
                <div className="w-px h-4 bg-surface-border mx-1" />
                <ToolbarButton onClick={() => { const u = prompt("URL:"); if(u) exec("createLink", u); }} label="Link" icon={<Icons.Link />} />
                
                <label className="ml-auto p-2 cursor-pointer text-secondary hover:text-accent transition-colors">
                    <input type="file" accept="image/*" multiple onChange={(e) => { handleFiles(Array.from(e.target.files)); e.target.value = null; }} className="hidden" />
                    <Icons.Image />
                </label>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
                className={`min-h-[240px] lg:min-h-[320px] p-4 lg:p-6 transition-colors ${dragOver ? "bg-accent/5" : ""}`}
            >
                <div
                    ref={editorDiv}
                    className="prose prose-sm lg:prose-base max-w-none focus:outline-none min-h-[220px] lg:min-h-[300px]"
                    contentEditable={!disabled}
                    onInput={triggerChange}
                    onPaste={() => setTimeout(triggerChange, 0)}
                    suppressContentEditableWarning={true}
                />
            </div>
        </div>
    );
});

export default RichTextEditor;
