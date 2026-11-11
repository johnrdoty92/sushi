import { Button as UIButton } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createRoom } from "@/lib/requests";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type ChangeEventHandler, type ComponentProps } from "react";
import { useNavigate, useSearchParams } from "react-router";
import useSWRMutation from "swr/mutation";

const Button = ({ className, ...props }: ComponentProps<typeof UIButton>) => {
  return <UIButton {...props} className={cn("text-lg px-8 py-6", className)} />;
};

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
      <Button disabled={!nickname || isMutating} onClick={handleCreateRoom}>
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
  const [roomName, setRoomName] = useState("");

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const input = e.target.value;
    if (isValidNickname(input)) setNickname(input);
  };

  return (
    <form noValidate className="flex flex-col gap-3">
      <Field>
        <FieldLabel>Nickname</FieldLabel>
        <Input className="text-lg py-6" value={nickname} onChange={handleChange} />
      </Field>
      <Field>
        <FieldLabel>Room Name</FieldLabel>
        <Input
          className="text-lg py-6"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value.toUpperCase())}
        />
      </Field>
      <Button disabled={!nickname || !roomName}>Join</Button>
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
          <Button className="basis-1/2" onClick={() => setSearchParams({ view: "create" })}>
            Create Room
          </Button>
          <Button
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
