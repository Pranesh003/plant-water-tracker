import { Eye, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination.jsx";
import { api } from "../services/api.js";

const PAGE_SIZE = 8;

export default function AdminUsers() {
  const [data, setData] = useState({ users: [], plants: [] });
  const [page, setPage] = useState(1);
  useEffect(() => {
    Promise.all([api.getUsers(), api.getAllPlants()]).then(([users, plants]) => setData({ users, plants }));
  }, []);
  const paginatedUsers = useMemo(() => data.users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [data.users, page]);
  return (
    <>
      <section className="page-title"><p className="eyebrow">Admin</p><h1>Users</h1></section>
      <section className="admin-table-shell">
        <table className="admin-data-table admin-users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Plants</th>
              <th>Created Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td className="text-capitalize">{user.role}</td>
                <td><strong>{data.plants.filter((plant) => plant.userId === user.id).length}</strong></td>
                <td>{user.createdDate}</td>
                <td><span className={`status-badge ${user.status?.toLowerCase() === "suspended" ? "overdue" : "safe"}`}>{user.status}</span></td>
                <td>
                  <div className="table-actions">
                    <Link className="ghost-btn" to={`/admin/users/${user.id}`}><Eye size={15} /> View</Link>
                    <Link className="ghost-btn" to={`/admin/users/${user.id}/manage`}><Settings size={15} /> Manage</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Pagination page={page} totalItems={data.users.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
}
