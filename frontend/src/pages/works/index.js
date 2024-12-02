import Layout from "@/components/layout/Layout";
import PageHead from "@/components/layout/PageHead";
import Link from "next/link";

export async function getServerSideProps() {
  try {
    const response = await fetch("http://goapp:8000/api/works");
    const works = await response.json();

    return {
      props: { works: works || [] },
    };
  } catch (error) {
    console.error("error fetching works:", error);
    return {
      props: { works: [] },
    };
  }
}

export default function Works({ works }) {
  const groupedWorks = works.reduce((acc, work) => {
    if (work.is_published) {
      acc[work.category] = acc[work.category] || [];
      acc[work.category].push(work);
    }
    return acc;
  }, {});

  return (
    <Layout>
      <PageHead headTitle="works" />
      <div className="flex justify-center">
        <div className="w-8/12">
          <p className="text-3xl mb-4 font-black red-underline">works</p>
          {Object.keys(groupedWorks).length > 0 ? (
            Object.entries(groupedWorks).map(([category, works]) => (
              <div
                key={category}
                className="mb-4"
              >
                <p className="text-lg font-bold">
                  <Link
                    href={`/works/${category}`}
                    className="red-underline font-black text-xl"
                  >
                    {category}
                  </Link>
                </p>
                <ul className="list-disc list-inside">
                  {works.map((work) => (
                    <li key={work.id}>
                      <Link
                        href={`/works/${work.category}/${work.id}`}
                        className="text-red-600"
                      >
                        {work.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div>
              <p>no published works found</p>
              <p>please be patient for the person to show off them extraordinarily amazing artistic work</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
