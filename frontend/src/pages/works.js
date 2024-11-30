import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";

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
                  works.map((work) => (
                    <div
                      key={work.id}
                      className="my-1 w-fit"
                    >
                      <li>
                        <p>
                          {work.title} ({work.category}) - ({new Date(work.created_at).toLocaleDateString("en-GB")})
                        </p>
                      </li>
                    </div>
                  ))
                ) : (
                  <div>
                    <p>no published work founded</p>
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
