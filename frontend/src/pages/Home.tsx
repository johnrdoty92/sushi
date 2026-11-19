import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Paper } from "@/components/ui/paper";
import { Spinner } from "@/components/ui/spinner";
import { createRoom } from "@/lib/requests";
import { ChevronLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type ChangeEventHandler, type SubmitEventHandler } from "react";
import { useNavigate, useSearchParams } from "react-router";
import useSWRMutation from "swr/mutation";
import sooshee from "@/assets/sooshee.webp";
import { Nigiri } from "./components/Nigiri";

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
  const { trigger, isMutating } = useSWRMutation("/rooms", createRoom, {
    onSuccess: (data) => navigate(`rooms/${data}?name=${nickname}`),
  });

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.target.value;
    if (isValidNickname(input)) setNickname(input);
  };

  const handleCreateRoom: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (isMutating) return;
    trigger();
  };

  return (
    <Paper className="relative">
      <Nigiri />
      <form noValidate className="flex flex-col gap-3 sm:gap-6" onSubmit={handleCreateRoom}>
        <Field>
          <FieldLabel>Your Nickname</FieldLabel>
          <Input
            autoComplete="off"
            className="text-lg py-6"
            value={nickname}
            onChange={handleChange}
          />
        </Field>
        <Button size="xl" disabled={!nickname || isMutating} type="submit">
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
    </Paper>
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

  const handleJoin: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const [word1, word2] = roomCode.split(" ");
    if (!word1 || !word2) return; // TODO: add GET to confirm existence of game
    navigate(`/rooms/${word1}-${word2}?name=${nickname}`.toLowerCase());
  };

  return (
    <Paper className="relative">
      <Nigiri />
      <form noValidate className="flex flex-col gap-2" onSubmit={handleJoin}>
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
        <Button disabled={!nickname || !roomCode} size="xl" type="submit" className="mt-5">
          Join
        </Button>
        <BackButton />
      </form>
    </Paper>
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
        <Paper className="relative">
          <img
            src={sooshee}
            alt="sooshee"
            className="max-w-3/4 sm:max-w-sm absolute bottom-full left-1/2 -translate-x-1/2 translate-y-6"
          />
          <p className="text-center mt-3 mb-3 sm:mb-6 sm:mt-1 leading-tight sm:leading-normal">
            Play with your friends to see who can collect the most soy sauce!
            <br />
            Create or join a room to get started!
          </p>
          <div className="flex flex-col min-[320px]:flex-row mb-1 gap-3 sm:gap-6">
            <Button
              className="flex-1"
              size="xl"
              onClick={() => setSearchParams({ view: "create" })}
            >
              Create Room
            </Button>
            <Button
              className="flex-1"
              size="xl"
              variant="secondary"
              onClick={() => setSearchParams({ view: "join" })}
            >
              Join Room
            </Button>
          </div>
        </Paper>
      );
  }
}

function Home() {
  return (
    <>
      <div className="absolute bottom-2 sm:bottom-1/10 left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Actions />
      </div>
    </>
  );
}

export default Home;
