import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createRoom } from "@/lib/requests";
import { ChevronLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type ChangeEventHandler } from "react";
import { useNavigate, useSearchParams } from "react-router";
import useSWRMutation from "swr/mutation";

const BackButton = () => {
  const setSearchParams = useSearchParams()[1];
  return (
    <Button onClick={() => setSearchParams({})} variant="link" className="text-sm p-2">
      <HugeiconsIcon icon={ChevronLeftIcon} />
      Back
    </Button>
  );
};

const isValidNickname = (input: string): boolean => {
  const alphanumericRegex = /^[\w\d]*$/i;
  return alphanumericRegex.test(input);
};

const CreateRoomForm = () => {
  const [nickname, setNickname] = useState("");
  const navigate = useNavigate();
  const { trigger, isMutating, error } = useSWRMutation("/rooms", createRoom, {
    onSuccess: (data) => navigate(`rooms/${data}?name=${nickname}`),
  });

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.target.value;
    if (isValidNickname(input)) setNickname(input);
  };

  const handleCreateRoom = () => {
    if (isMutating) return;
    trigger();
  };

  return (
    <form noValidate className="flex flex-col gap-3">
      <Field>
        <FieldLabel>Nickname</FieldLabel>
        <Input
          autoComplete="off"
          className="text-lg py-6"
          value={nickname}
          onChange={handleChange}
        />
      </Field>
      <Button size="xl" disabled={!nickname || isMutating} onClick={handleCreateRoom}>
        {isMutating ? (
          <div className="flex gap-1">
            <Spinner />
            Creating...
          </div>
        ) : (
          "Create"
        )}
      </Button>
      <BackButton />
    </form>
  );
};

const JoinRoomForm = () => {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.target.value;
    if (isValidNickname(input)) setNickname(input);
  };

  const handleJoin = () => {
    const [word1, word2] = roomCode.split(" ");
    if (!word1 || !word2) return; // TODO: add GET to confirm existence of game
    navigate(`/rooms/${word1}-${word2}?name=${nickname}`.toLowerCase());
  };

  return (
    <form noValidate className="flex flex-col gap-3">
      <Field>
        <FieldLabel>Nickname</FieldLabel>
        <Input
          autoComplete="off"
          className="text-lg py-6"
          value={nickname}
          onChange={handleChange}
        />
      </Field>
      <Field>
        <FieldLabel>Room Code</FieldLabel>
        <Input
          autoComplete="off"
          className="text-lg py-6"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />
      </Field>
      <Button disabled={!nickname || !roomCode} size="xl" onClick={handleJoin}>
        Join
      </Button>
      <BackButton />
    </form>
  );
};

function Actions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view");

  switch (view) {
    case "create":
      return <CreateRoomForm />;
    case "join":
      return <JoinRoomForm />;
    default:
      return (
        <div className="flex gap-3">
          <Button
            className="basis-1/2"
            size="xl"
            onClick={() => setSearchParams({ view: "create" })}
          >
            Create Room
          </Button>
          <Button
            size="xl"
            className="basis-1/2"
            variant="secondary"
            onClick={() => setSearchParams({ view: "join" })}
          >
            Join Room
          </Button>
        </div>
      );
  }
}

function Home() {
  return (
    <>
      <h1 className="absolute top-1/5 text-center text-3xl w-full px-auto">Sushi</h1>
      <div className="absolute bottom-1/5 left-1/2 -translate-x-1/2">
        <Actions />
      </div>
    </>
  );
}

export default Home;
