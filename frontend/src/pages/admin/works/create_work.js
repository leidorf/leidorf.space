import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const create_work = () => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [contentType, setContentType] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSelectChange = (e) => {
    const selectedCategory = e.target.value;
    setCategory(selectedCategory);
    setError("");

    if (selectedCategory === "poem" || selectedCategory === "story") {
      setContentType("text");
    } else if (["digital-art", "pixel-art", "glitch-art", "photography"].includes(selectedCategory)) {
      setContentType("image");
    } else {
      setContentType("");
      setError("content_type and category dont match");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile ? selectedFile.name : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content_type = contentType;
    if (!title || !author || !category || (contentType === "text" && !content) || (contentType === "image" && !file)) {
      setError("please fill out all fields!");
      return;
    }
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/works", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          author,
          content_type,
          category,
          content: contentType === "text" ? content : null,
          image_path: contentType === "image" ? file : null,
          image_name: contentType === "image" ? file : null,
        }),
      });

      if (!response.ok) {
        throw new Error("invalid field values!");
      }
    } catch (err) {
      setError(err.message);
    }

    console.log("work created:", {
      title,
      author,
      content_type,
      category,
      content: contentType === "text" ? content : null,
      image_path: contentType === "image" ? file : null,
      image_name: contentType === "image" ? file : null,
    });
    router.push("../works");
  };

  return (
    <>
      <Layout>
        <PageHead headTitle={`create work`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <p>create work</p>
            <form
              className="mb-4"
              onSubmit={handleSubmit}
            >
              <div className="mb-2">
                <label className="block">title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-section pl-2"
                  required
                />
                <label className="block">author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="input-section pl-2"
                  required
                />
                <label className="block">category</label>
                <select
                  id="dropdown"
                  value={category}
                  onChange={handleSelectChange}
                  className="input-section px-2"
                  required
                >
                  <option
                    value=""
                    disabled
                  >
                    category
                  </option>
                  <option value="poem">poem</option>
                  <option value="story">story</option>
                  <option value="digital-art">digital-art</option>
                  <option value="pixel-art">pixel-art</option>
                  <option value="glitch-art">glitch-art</option>
                  <option value="photography">photography</option>
                </select>
                {contentType === "text" && (
                  <div className="mb-2">
                    <label className="block">content</label>
                    <textarea
                      placeholder="content..."
                      rows={6}
                      className="input-section"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                  </div>
                )}
                {contentType === "image" && (
                  <div className="mb-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      required
                    />
                    <label
                      htmlFor="file-upload"
                      className="block input-section w-1/12 text-center"
                    >
                      upload image
                    </label>
                    <p className="mt-2 text-zinc-300">{file ? `${file}` : "no file selected."}</p>
                  </div>
                )}
              </div>
              {error && <p className="text-red-600 mb-2">{error}</p>}
              <div>
                <button
                  type="submit"
                  className="button-submit my-2"
                >
                  create
                </button>
              </div>
            </form>
            <Link
              href={`../dashboard`}
              className="red-underline"
            >
              go back
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default create_work;
