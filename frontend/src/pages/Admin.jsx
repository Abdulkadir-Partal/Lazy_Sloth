import { useEffect, useState } from "react";
import api from "../api";

function Admin() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get("/api/users/")
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  }, []);

  const updateUser = (profileId, field, value) => {
    api.patch(`/api/users/profile/${profileId}/`, {
      [field]: value
    })
    .then(() => {
      // local state güncelle
      setUsers(prev =>
        prev.map(u =>
          u.profile.id === profileId
            ? { ...u, profile: { ...u.profile, [field]: value } }
            : u
        )
      );
    })
    .catch(err => {
      console.error(err);
      alert("Update failed");
    });
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>

              <td>
                <select
                  value={u.profile.role}
                  onChange={e =>
                    updateUser(u.profile.id, "role", e.target.value)
                  }
                >
                  <option value="admin">admin</option>
                  <option value="moderator">moderator</option>
                  <option value="user">user</option>
                </select>
              </td>

              <td>
                <select
                  value={u.profile.status}
                  onChange={e =>
                    updateUser(u.profile.id, "status", e.target.value)
                  }
                >
                  <option value="active">active</option>
                  <option value="banned">banned</option>
                  <option value="restricted">restricted</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
