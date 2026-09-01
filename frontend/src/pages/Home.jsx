import { useState, useEffect } from "react";
import api from "../api";
import Note from "../components/Note";
import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    getNotes();
  }, []);

  useEffect(() => {
    function onNotesChanged() {
      getNotes();
    }

    window.addEventListener("notesChanged", onNotesChanged);
    return () => window.removeEventListener("notesChanged", onNotesChanged);
  }, []);

  const getNotes = () => {
    api
      .get("/api/notes/")
      .then((res) => {
        console.log("API NOTES RESPONSE:", res.data);
        // En yeniden eskiye göre sırala (created_at'e göre ters sıra)
        const sortedNotes = [...res.data].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        setNotes(sortedNotes);
      })
      .catch((err) => alert(err));
  };


  const deleteNote = (id) => {
    api
      .delete(`/api/notes/delete/${id}/`)
      .then(() => getNotes())
      .catch((error) => alert(error));
  };

  return (
    <div>
      <h2>Notes</h2>

      {notes.map((note) => (
        <Note note={note} onDelete={deleteNote} onUpdate={getNotes} key={note.id} />
      ))}
    </div>
  );
}

export default Home;
