using System.ComponentModel.DataAnnotations.Schema;

namespace RT_API.Models
{

    [Table("tasks")]
    public class TaskItem
    {

        public Guid id {  get; set; }
        public string title { get; set; } = string.Empty;
        public string? description { get; set; }
        public bool status { get; set; }
        public DateTime createdat { get; set; } = DateTime.UtcNow;



    }
}
