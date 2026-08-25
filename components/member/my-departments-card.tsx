import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function MyDepartmentsCard({
  departments,
}: {
  departments: Array<{ id: string; name: string }>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your departments</CardTitle>
        <CardDescription>Teams you serve in at this campus.</CardDescription>
      </CardHeader>
      <CardContent>
        {departments.length ? (
          <div className="flex flex-wrap gap-1.5">
            {departments.map((department) => (
              <Badge
                key={department.id}
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                {department.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You are not assigned to a department yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
