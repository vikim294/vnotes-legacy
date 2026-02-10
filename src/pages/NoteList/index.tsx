import { useEffect, useRef, useState } from "react";
import Button from "../../components/Button";
import type { NoteListItem } from "../../types/note";
import useModal from "../../components/useModal";
import { API_BASE_URL } from "../../api";
import { Link } from "react-router";

export default function NoteList() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const currentNoteRef = useRef<NoteListItem | null>(null);

  // add node
  const {
    Modal: AddModal,
    openModal: openAddModal,
    closeModal: closeAddModal,
  } = useModal();

  const [newNoteTitle, setNewNoteTitle] = useState("");

  const openCreateNoteModal = () => {
    setNewNoteTitle("");
    openAddModal();
  };

  const confirmCreateNote = async () => {
    const response = await fetch(`${API_BASE_URL}/notes/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newNoteTitle,
      }),
    });
    const res = await response.json();
    if (res.code === 0) {
      getNotes();
      closeAddModal();
    }
  };

  // edit node
  const {
    Modal: EditModal,
    openModal: openEditModal,
    closeModal: closeEditModal,
  } = useModal();

  const handleEditNote = (note: NoteListItem) => {
    currentNoteRef.current = note;
    openEditModal();
    setNewNoteTitle(note.title);
  };

  const confirmEditNote = async () => {
    const response = await fetch(`${API_BASE_URL}/notes/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentNoteRef.current?.id,
        title: newNoteTitle,
      }),
    });
    const res = await response.json();
    if (res.code === 0) {
      closeEditModal();
      getNotes();
    }
  };

  // delete node
  const {
    Modal: DeleteConfirmModal,
    openModal: openDeleteConfirmModal,
    closeModal: closeDeleteConfirmModal,
  } = useModal();

  const handleDeleteNote = (note: NoteListItem) => {
    currentNoteRef.current = note;
    openDeleteConfirmModal();
  };

  const confirmDeleteNote = async () => {
    const response = await fetch(`${API_BASE_URL}/notes/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: currentNoteRef.current?.id,
      }),
    });
    const res = await response.json();
    if (res.code === 0) {
      closeDeleteConfirmModal();
      getNotes();
    }
  };

  const getNotes = async () => {
    const response = await fetch(`${API_BASE_URL}/notes/list`);
    const res = await response.json();
    if (res.code === 0) {
      setNotes(res.data);
    }
  };

  useEffect(() => {
    getNotes();
  }, []);

  return (
    <div>
      <div>
        <Button type="primary" onClick={openCreateNoteModal}>
          new note
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="flex items-center justify-between p-3 rounded-lg bg-surface/50 backdrop-blur-sm border border-border/30">
            <div className="text-foreground font-medium">{note.title}</div>

            <div className="flex gap-2">
              <Link to={`/noteDetails/${note.id}`}>
                <Button className="" type="primary">
                  detail
                </Button>
              </Link>
              <Button className="" onClick={() => handleEditNote(note)}>
                edit
              </Button>
              <Button type="danger" onClick={() => handleDeleteNote(note)}>
                delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* modals */}
      <>
        <AddModal
          width={600}
          header="new note"
          footer={
            <div>
              <Button onClick={closeAddModal}>cancel</Button>
              <Button type="primary" onClick={confirmCreateNote}>
                confirm
              </Button>
            </div>
          }
        >
          <label>
            Title:
            <input
              type="text"
              className="bg-textarea w-full p-2 outline-none"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
          </label>
        </AddModal>

        <EditModal
          header="edit note"
          footer={
            <div>
              <Button onClick={closeEditModal}>cancel</Button>
              <Button type="primary" onClick={confirmEditNote}>
                confirm
              </Button>
            </div>
          }
        >
          <label>
            new title:
            <input
              type="text"
              className="bg-textarea w-full p-2 outline-none"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
          </label>
        </EditModal>

        <DeleteConfirmModal
          header="are you sure to delete this note?"
          footer={
            <div>
              <Button onClick={closeDeleteConfirmModal}>cancel</Button>
              <Button type="primary" onClick={confirmDeleteNote}>
                confirm
              </Button>
            </div>
          }
        ></DeleteConfirmModal>
      </>
    </div>
  );
}
