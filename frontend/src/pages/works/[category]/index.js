import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import { formatDate } from "@/components/utils/date";
import Link from "next/link";

export async function getServerSideProps(context) {
  const { category } = context.params;

  const works = await fetch(`http://goapp:8000/api/works/${category}`).then((res) => res.json());

  return {
    props: {
      category,
      works,
    },
  };
}

export default function Category({ category, works }) {
  return (
    <>
      <Layout>
        <PageHead headTitle={category}></PageHead>

        <div className="flex justify-center">
          <div className="w-8/12">
            <div className="mb-4">
              <p className="text-3xl mb-4 font-black red-underline">{category}</p>
              {Array.isArray(works) && works.length > 0 ? (
                works.some((work) => work.is_published) ? (
                  works.map(
                    (work) =>
                      work.is_published && (
                        <li
                          className="my-1 w-fit list-disc list-inside"
                          key={work.id}
                        >
                          <Link
                            className="text-red-700 font-black"
                            href={`/works/${category}/${work.id}`}
                          >
                            {work.title}
                          </Link>{" "}
                          ({work.author}) - ({formatDate(work.created_at)})
                        </li>
                      )
                  )
                ) : (
                  <div>
                    <p>no published work found</p>
                    <p>please be patient for the person to show off them extraordinarily amazing artistic work</p>
                  </div>
                )
              ) : (
                <div>
                  <p>no works available</p>
                </div>
              )}
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
