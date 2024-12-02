import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import { formatDate } from "@/components/utils/date";
import Link from "next/link";

export async function getServerSideProps(context) {
  const { work } = context.params;
  try {
    const response = await fetch(`http://goapp:8000/api/work/${work}`);
    if (!response.ok) {
      throw new Error("failed to fetch data");
    }
    const workData = await response.json();
    return {
      props: { workData },
    };
  } catch (error) {
    console.error("error fetching work:", error);
    return {
      props: { work: null },
    };
  }
}

export default function Work({ workData }) {
  if (!workData || !workData.is_published) {
    return (
      <Layout>
        <PageHead headTitle="work not found" />
        <div className="flex justify-center">
          <div className="w-8/12 text-center">
            <p className="text-2xl mb-4 font-black red-underline">the requested work was not found.</p>
            <Link
              href={`/works`}
              className="red-underline"
            >
              go back
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <>
      <Layout>
        <PageHead headTitle={workData.title}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <div className="mb-4">
              <p className="text-3xl mb-4 font-black red-underline">{workData.title}</p>
              <p>
                <Link className="text-red-700" href={`/works/${workData.category}`}>/{workData.category}</Link>
              </p>

              <div className="border p-2 my-2 inline-block">
                {workData.content_type === "text" ? (
                  <p className="w-fit">{workData.content}</p>
                ) : (
                  <img
                    className="w-full max-w-xs lg:max-w-md h-auto"
                    src={`/works/${workData.image_name}`}
                    alt={workData.title}
                  />
                )}
              </div>

              <p className="text-red-600">- {workData.author}</p>
              <p>{formatDate(workData.created_at)}</p>
            </div>
            <Link
              className="red-underline"
              href={`/works`}
            >
              go back?
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}
