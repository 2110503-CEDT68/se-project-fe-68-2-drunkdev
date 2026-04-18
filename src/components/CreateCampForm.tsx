import React, { useState } from "react";
import styles from "./CreateCampForm.module.css";
import { createCamp } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Room } from "@/types/camp";

export default function CreateCampForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    address: "",
    district: "",
    province: "",
    postalcode: "",
    tel: "",
    region: "",
    description: "",
  });

  const [imgSrc, setImgSrc] = useState<string[]>([""]);
  const [rooms, setRooms] = useState<Room[]>([
    { roomType: "", price: 0, capacity: 1 },
  ]);

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (i: number, value: string) => {
    const arr = [...imgSrc];
    arr[i] = value;
    setImgSrc(arr);
  };

  const addImage = () => setImgSrc([...imgSrc, ""]);

  const handleRoomChange = (i: number, field: keyof Room, value: string) => {
    const arr = [...rooms];

    if (field === "price" || field === "capacity") {
      arr[i][field] = Number(value);
    } else {
      arr[i][field] = value;
    }

    setRooms(arr);
  };

  const addRoom = () => {
    setRooms([...rooms, { roomType: "", price: 0, capacity: 1 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const token = getToken();
    if (!token) { router.push('/auth'); return}
    e.preventDefault();
    try {
      setLoading(true);

      await createCamp(token, {
        ...form,
        imgSrc: imgSrc.filter((i) => i),
        rooms,
      });

      alert("Camp created!");
    } catch (err) {
      console.error(err);
      alert("Error creating camp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2>Create Camp</h2>

        {/* BASIC */}
        <div className={styles.grid}>
          <input name="name" placeholder="Camp name" onChange={handleChange} required />
          <input name="region" placeholder="Region" onChange={handleChange} required />
        </div>

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          required
        />

        <div className={styles.grid}>
          <input name="address" placeholder="Address" onChange={handleChange} required />
          <input name="district" placeholder="District" onChange={handleChange} required />
        </div>

        <div className={styles.grid}>
          <input name="province" placeholder="Province" onChange={handleChange} required />
          <input name="postalcode" placeholder="Postal Code" onChange={handleChange} required />
        </div>

        <input name="tel" placeholder="Telephone" onChange={handleChange} />

        {/* IMAGES */}
        <div className={styles.section}>
          <h3>Images</h3>
          {imgSrc.map((img, i) => (
            <input
              key={i}
              placeholder="Image URL"
              value={img}
              onChange={(e) => handleImageChange(i, e.target.value)}
            />
          ))}
          <button type="button" onClick={addImage} className={styles.secondaryBtn}>
            + Add Image
          </button>
        </div>

        {/* ROOMS */}
        <div className={styles.section}>
          <h3>Rooms</h3>
          {rooms.map((room, i) => (
            <div key={i} className={styles.roomBox}>
              <input
                placeholder="Room type"
                onChange={(e) => handleRoomChange(i, "roomType", e.target.value)}
              />
              <input
                type="number"
                placeholder="Price"
                onChange={(e) => handleRoomChange(i, "price", e.target.value)}
              />
              <input
                type="number"
                placeholder="Capacity"
                onChange={(e) => handleRoomChange(i, "capacity", e.target.value)}
              />
            </div>
          ))}

          <button type="button" onClick={addRoom} className={styles.secondaryBtn}>
            + Add Room
          </button>
        </div>

        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? "Creating..." : "Create Camp"}
        </button>
      </form>
    </div>
  );
}