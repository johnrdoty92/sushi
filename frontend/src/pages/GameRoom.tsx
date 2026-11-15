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
import { cn } from "cn";

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
          <DialogTitle>Results</DialogTitle>
        </DialogHeader>
        {playerScores.map(({ id, name, score }) => (
          <div className="flex justify-between p-1" key={id}>
            <span>{name}</span>
            <span>{score}</span>
          </div>
        ))}
        <ResetButton />
      </DialogContent>
    </Dialog>
  );
};

const RoomCode = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  if (!slug) return <></>;
  const roomCode = slug.split("-").join(" ").toUpperCase();
  return (
    <div className="absolute w-full flex justify-between">
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
      <div className="flex gap-2">
        <span>Room Code: </span>
        <span className="font-mono">{roomCode}</span>
      </div>
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
        "absolute font-mono top-1/6 left-1/2 -translate-x-1/2 text-xl",
        minutes < 1 && seconds <= 5 ? "text-destructive" : "",
      )}
    >{`${pad(minutes)}:${pad(seconds)}:${pad(millis)}`}</Paper>
  );
};

const Actions = () => {
  const timeRemaining = useConnectionState((s) => s.room.timeRemaining);
  const isPendingStart = timeRemaining === -1;
  const isOver = timeRemaining === 0;
  if (isPendingStart) {
    return (
      <Paper className="absolute bottom-1/6 left-1/2 -translate-x-1/2 flex flex-col gap-6">
        <Nigiri />
        <p className="text-center">
          {window.navigator.maxTouchPoints > 0 ? "Tap" : "Click"} anywhere on the board to move
          around. Gather up as many soy sauce dishes as you can before time runs out. Press start
          when everyone is ready!
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
