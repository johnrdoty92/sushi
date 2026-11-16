import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paper } from "@/components/ui/paper";
import { Spinner } from "@/components/ui/spinner";
import { resetRoom, startRoom } from "@/lib/requests";
import { useConnectionState } from "@/lib/store";
import { LogoutSquare02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import useWebSocket from "react-use-websocket";
import useSWRMutation from "swr/mutation";
import { Nigiri } from "./components/Nigiri";
import results from "@/assets/results.webp";
import { cn } from "cn";

const useRoomCode = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return "";
  return slug.split("-").join(" ").toUpperCase();
};

const ResetButton = () => {
  const slug = useParams<{ slug: string }>().slug ?? "";
  const { trigger, isMutating } = useSWRMutation(
    `/rooms/${slug}/reset`,
    (_: string, { arg }: { arg: { slug: string } }) => resetRoom(arg.slug),
  );
  return (
    <Button size="xl" disabled={isMutating} onClick={() => trigger({ slug })}>
      Rematch
    </Button>
  );
};

const GameResults = () => {
  const isOver = useConnectionState((s) => s.room.timeRemaining === 0);
  const players = useConnectionState((s) => s.room.subscribers);
  const items = useConnectionState((s) => s.room.items);
  const tally = items.reduce((acc, curr) => {
    const currentCount = acc.get(curr.ownerId) ?? 0;
    acc.set(curr.ownerId, currentCount + 1);
    return acc;
  }, new Map<string, number>());
  const playerScores = players
    .map((p) => ({
      id: p.id,
      name: p.name,
      score: tally.get(p.id) ?? 0,
    }))
    .sort((a, b) => a.score - b.score);

  return (
    <Dialog open={isOver}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="relative">
            <img src={results} alt="results" className="absolute bottom-full" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col rounded-md border border-primary-foreground overflow-hidden">
          <div className="flex justify-between py-2 px-3 text-white bg-primary-foreground">
            <span>Player</span>
            <span>Score</span>
          </div>
          {playerScores.map(({ id, name, score }) => (
            <div
              className="flex justify-between py-2 px-4 odd:bg-fuchsia-200 even:bg-fuchsia-100"
              key={id}
            >
              <span>{name}</span>
              <span>{score}</span>
            </div>
          ))}
        </div>
        <ResetButton />
      </DialogContent>
    </Dialog>
  );
};

const RoomCode = () => {
  const timeRemaining = useConnectionState((s) => s.room.timeRemaining);
  const isInProgress = timeRemaining > 0;
  const navigate = useNavigate();
  const roomCode = useRoomCode();

  if (!roomCode) return <></>;

  return (
    <div className="absolute w-full flex justify-between items-center">
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="ghost">
              <HugeiconsIcon icon={LogoutSquare02Icon} />
              Leave
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to leave the room?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => navigate("/")}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {isInProgress && (
        <div className="flex items-center my-2 mr-4 border border-amber-900 rounded-sm bg-white overflow-hidden">
          <span className="text-sm text-white bg-amber-900 px-2 py-1">Room Code</span>
          <span className="font-mono text-sm text-amber-800 px-2">{roomCode}</span>
        </div>
      )}
    </div>
  );
};

const StartButton = () => {
  const { slug } = useParams<{ slug: string }>();
  const { trigger, isMutating, error, data } = useSWRMutation(`/rooms/${slug}`, () =>
    startRoom(slug ?? ""),
  );

  const handleStart = () => {
    trigger();
  };

  return (
    <Button className="w-full" size="xl" onClick={handleStart} disabled={isMutating || !!data}>
      {isMutating ? <Spinner /> : "Start"}
    </Button>
  );
};

const TimeRemaining = ({ time }: { time: number }) => {
  const pad = (input: number) => input.toString().padStart(2, "0");
  const seconds = Math.floor(time / 1000) % 60;
  const minutes = Math.floor(time / (1000 * 60)) % 60;
  const millis = (Math.floor(time / 100) * 10) % 100;
  return (
    <Paper
      className={cn(
        "absolute font-mono top-1/6 left-1/2 -translate-x-1/2 text-xl text-amber-900 border-amber-900",
        minutes < 1 && seconds <= 5 ? "text-destructive" : "",
      )}
    >{`${pad(minutes)}:${pad(seconds)}:${pad(millis)}`}</Paper>
  );
};

const Actions = () => {
  const timeRemaining = useConnectionState((s) => s.room.timeRemaining);
  const isPendingStart = timeRemaining === -1;
  const isOver = timeRemaining === 0;
  const roomCode = useRoomCode();

  if (isPendingStart) {
    return (
      <Paper className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col gap-4">
        <Nigiri />
        <p className="text-center">Invite other players with this code:</p>
        <p className="font-mono text-center bg-white py-3 rounded-lg border border-orange-300">
          {roomCode}
        </p>
        <p className="text-center">
          {window.navigator.maxTouchPoints > 0 ? "Tap" : "Click"} on the board to move. The soy
          sauce as it appears. Press start when everyone is ready!
        </p>
        <StartButton />
      </Paper>
    );
  } else if (!isOver) {
    return <TimeRemaining time={timeRemaining} />;
  } else {
    return <></>;
  }
};

const Connection = () => {
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

  return <></>;
};

function GameRoom() {
  return (
    <>
      <RoomCode />
      <Connection />
      <Actions />
      <GameResults />
    </>
  );
}

export default GameRoom;
