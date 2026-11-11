import { useConnectionState } from "@/lib/store";
import { useParams, useSearchParams } from "react-router";
import useWebSocket from "react-use-websocket";

function GameRoom() {
  const { slug } = useParams<{ slug: string }>();
  const nickname = useSearchParams()[0].get("name") ?? "anonymous";
  const setId = useConnectionState((s) => s.setId);
  const setRoomState = useConnectionState((s) => s.setRoomState);
  const reset = useConnectionState((s) => s.reset);

  useWebSocket(`${import.meta.env.VITE_API_URL}/rooms/${slug}`, {
    queryParams: { name: nickname },
    onClose: reset,
    onMessage(event) {
      try {
        const message = JSON.parse(event.data);
        if ("id" in message) {
          setId(message.id);
        } else {
          setRoomState(message);
        }
      } catch (error) {
        console.error(error);
      }
    },
  });

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
