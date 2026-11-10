import { useParams } from "react-router";

function GameRoom() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <>
      <section id="center">
        <div>
          <h1>Game Room</h1>
          <p>{slug}</p>
        </div>
      </section>
    </>
  );
}

export default GameRoom;
