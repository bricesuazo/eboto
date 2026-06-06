import { formatName } from '~/lib/election';
import { cn } from '~/lib/utils';

interface BallotPosition {
  id: string;
  name: string;
  isAbstain: boolean;
  candidates: {
    id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    partylistAcronym: string;
  }[];
}

export function SubmittedBallot({
  ballot,
  nameArrangement,
  className,
  heading,
}: {
  ballot: BallotPosition[];
  nameArrangement: number;
  className?: string;
  heading?: string;
}) {
  return (
    <div className={cn(className)}>
      {heading && <h2 className="text-lg ">{heading}</h2>}
      <ul className={cn('divide-y rounded-md border text-sm', heading && 'mt-3')}>
        {ballot.map((position) => (
          <li key={position.id} className="px-3 py-2">
            <p className="font-medium">{position.name}</p>
            <div className="mt-1">
              {position.isAbstain ? (
                <p className="text-muted-foreground italic">Abstained</p>
              ) : position.candidates.length === 0 ? (
                <p className="text-muted-foreground italic">No selection</p>
              ) : (
                <ul className="list-disc space-y-0.5 pl-5">
                  {position.candidates.map((candidate) => {
                    const name = formatName(nameArrangement, candidate);
                    return (
                      <li key={candidate.id}>
                        {candidate.partylistAcronym
                          ? `${name} (${candidate.partylistAcronym})`
                          : name}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
