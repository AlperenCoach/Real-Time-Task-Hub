using System.ComponentModel.DataAnnotations.Schema;

namespace RT_API.Models
{
    [Table("task_counter")]
    public class TaskCounter
    {
        public int id { get; set; } = 1; // Single row table
        public int completedallTasks { get; set; } = 0;
    }
}
