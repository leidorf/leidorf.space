import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import { formatDate } from "@/components/utils/date";

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

export default function Works({ works }) {
  return (
    <>
      <Layout>
        <PageHead headTitle={`works`}></PageHead>
        <div className="flex justify-center">
          <div className="w-8/12">
            <div>
              <ul>
                {Array.isArray(works) && works.length > 0 ? (
                  works.some((work) => work.is_published) ? (
                    works.map(
                      (work) =>
                        work.is_published && (
                          <div
                            key={work.id}
                            className="my-1 w-fit"
                          >
                            <li>
                              <p>
                                {work.title} ({work.category}) - ({formatDate(work.created_at)})
                              </p>
                            </li>
                          </div>
                        )
                    )
                  ) : (
                    <div>
                      <p>no published work found</p>
                    </div>
                  )
                ) : (
                  <div>
                    <p>no works available</p>
                  </div>
                )}
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
