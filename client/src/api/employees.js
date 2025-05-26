export default async function fetchEmployees() {
    const response = await fetch("http://localhost:5000/api/employees");
    if (!response.ok) {
      throw new Error("Failed to fetch employees");
    }
    return await response.json();
  }
  