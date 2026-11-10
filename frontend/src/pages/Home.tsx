import { Button as UIButton } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type ComponentProps } from "react";
import { useSearchParams } from "react-router";

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

const CreateRoomForm = () => {
  const [name, setName] = useState("");

  return (
    <form noValidate className="flex flex-col gap-3">
      <Field>
        <FieldLabel>Your Name</FieldLabel>
        <Input className="text-lg py-6" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Button disabled={!name}>Create</Button>
      <BackButton />
    </form>
  );
};

const JoinRoomForm = () => {
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel>Your Name</FieldLabel>
        <Input className="text-lg py-6" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field>
        <FieldLabel>Room Name</FieldLabel>
        <Input
          className="text-lg py-6"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value.toUpperCase())}
        />
      </Field>
      <Button disabled={!name || !roomName}>Join</Button>
      <BackButton />
    </div>
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
