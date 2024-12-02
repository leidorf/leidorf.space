import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const withAuth = (WrappedComponent) => {
  return function ProtectedPage(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
      const checkJWT = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
          setLoading(false);
          router.push("/admin/login");
          return;
        }

        const response = await fetch("http://localhost:8000/api/admin", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          setLoading(false);
          router.push("/admin/login");
        } else {
          setIsAuthenticated(true);
          setLoading(false);
        }
      };

      checkJWT();
    }, [router]);

    if (loading) {
      return (
        <div className="flex justify-center">
          <p className="text-lg">checking authentication...</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
