import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

export async function getServerSideProps() {
  try {
    const response = await fetch("http://goapp:8000/api/works");
    const works = await response.json();

    return {
      props: { works },
    };
  } catch (error) {
    console.error("error:", error);
    return {
      props: { works: [] },
    };
  }
}

const Works = ({ works }) => {
  return (
    <>
      <Layout>
        <PageHead headTitle={`works`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <div className="mb-4">
              <p className="text-2xl mb-4 font-black red-underline">workss!!</p>
              <Link
                href={`./works/create_work`}
                className="header-item"
              >
                create work!!
              </Link>
              <div className="py-2">
                <ul>
                  {Array.isArray(works) && works.length > 0 ? (
                    works.map((work) => (
                      <div
                        key={work.id}
                        className="my-1 w-fit"
                      >
                        <li>
                          <p>
                            {work.id} -{" "}
                            <Link
                              href={`./works/${work.id}`}
                              className="red-underline"
                            >
                              {work.title} ({work.category})
                            </Link>{" "}
                            - {work.is_published ? "✅" : "❌"}
                          </p>
                        </li>
                      </div>
                    ))
                  ) : (
                    <p className="my-1">no works found.</p>
                  )}
                </ul>
              </div>
            </div>
            <Link
              href={`./dashboard`}
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

export default Works;
