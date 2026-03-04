import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  LinkOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Space, Tooltip } from "antd";
import { useEffect } from "react";

interface TiptapEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MenuBar = ({ editor, disabled }: { editor: any; disabled?: boolean }) => {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL");
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-800 bg-zinc-900/50 rounded-t-lg">
      <Space size={4}>
        <Tooltip title="Bold">
          <Button
            type={editor.isActive("bold") ? "primary" : "text"}
            size="small"
            icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
          />
        </Tooltip>
        <Tooltip title="Italic">
          <Button
            type={editor.isActive("italic") ? "primary" : "text"}
            size="small"
            icon={<ItalicOutlined />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
          />
        </Tooltip>
        <Tooltip title="Underline">
          <Button
            type={editor.isActive("underline") ? "primary" : "text"}
            size="small"
            icon={<UnderlineOutlined />}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={disabled}
          />
        </Tooltip>
      </Space>

      <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

      <Space size={4}>
        <Tooltip title="Bullet List">
          <Button
            type={editor.isActive("bulletList") ? "primary" : "text"}
            size="small"
            icon={<UnorderedListOutlined />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
          />
        </Tooltip>
        <Tooltip title="Ordered List">
          <Button
            type={editor.isActive("orderedList") ? "primary" : "text"}
            size="small"
            icon={<OrderedListOutlined />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
          />
        </Tooltip>
      </Space>

      <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

      <Space size={4}>
        <Tooltip title="Align Left">
          <Button
            type={editor.isActive({ textAlign: "left" }) ? "primary" : "text"}
            size="small"
            icon={<AlignLeftOutlined />}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            disabled={disabled}
          />
        </Tooltip>
        <Tooltip title="Align Center">
          <Button
            type={editor.isActive({ textAlign: "center" }) ? "primary" : "text"}
            size="small"
            icon={<AlignCenterOutlined />}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            disabled={disabled}
          />
        </Tooltip>
        <Tooltip title="Align Right">
          <Button
            type={editor.isActive({ textAlign: "right" }) ? "primary" : "text"}
            size="small"
            icon={<AlignRightOutlined />}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            disabled={disabled}
          />
        </Tooltip>
      </Space>

      <div className="w-[1px] h-4 bg-zinc-700 mx-1" />

      <Tooltip title="Add Link">
        <Button
          type={editor.isActive("link") ? "primary" : "text"}
          size="small"
          icon={<LinkOutlined />}
          onClick={addLink}
          disabled={disabled}
        />
      </Tooltip>
    </div>
  );
};

export const TiptapEditor = ({
  value,
  onChange,
  placeholder,
  disabled,
}: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-400 underline cursor-pointer",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Write something...",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // If it's just an empty paragraph, send empty string to help with change detection
      onChange?.(html === "<p></p>" ? "" : html);
    },
    editable: !disabled,
  });

  // Sync value from parent (Ant Design Form)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  return (
    <div
      className={`border rounded-lg transition-all duration-200 ${
        disabled
          ? "border-zinc-800 bg-zinc-900/30 opacity-60"
          : "border-zinc-800 bg-zinc-950 focus-within:border-blue-500 hover:border-zinc-600"
      }`}
    >
      <MenuBar editor={editor} disabled={disabled} />
      <div className="p-4 min-h-[150px] cursor-text prose prose-invert prose-sm prose-zinc max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
